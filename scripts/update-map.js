const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const cheerio = require('cheerio');

const calculateCoordinates = (domain) => {
  const hash = crypto.createHash('md5').update(domain).digest('hex');
  const xHex = hash.slice(0, 6);
  const yHex = hash.slice(6, 12);
  
  const xCoord = (parseInt(xHex, 16) % 1000000) / 1000;
  const yCoord = (parseInt(yHex, 16) % 1000000) / 1000;
  
  return {
    x: xCoord.toFixed(3),
    y: yCoord.toFixed(3)
  };
};

const updateFiles = () => {
  const srcDir = path.join(__dirname, '../public');
  const distDir = path.join(__dirname, '../dist');
  
  const manifestSrcPath = path.join(srcDir, 'manifest.json');
  const indexSrcPath = path.join(srcDir, 'index.html');
  const cssSrcPath = path.join(srcDir, 'planet.css');
  const jsSrcPath = path.join(srcDir, 'map.js');
  
  const manifestDistPath = path.join(distDir, 'manifest.json');
  const indexDistPath = path.join(distDir, 'index.html');
  const cssDistPath = path.join(distDir, 'planet.css');
  const jsDistPath = path.join(distDir, 'map.js');

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestSrcPath, 'utf8'));
  const myDomain = new URL(manifest.canonical_url).hostname;
  const myCoords = calculateCoordinates(myDomain);
  
  manifest.coordinates = {
    x: parseFloat(myCoords.x),
    y: parseFloat(myCoords.y)
  };
  
  fs.writeFileSync(manifestDistPath, JSON.stringify(manifest, null, 2));
  fs.copyFileSync(cssSrcPath, cssDistPath);
  fs.copyFileSync(jsSrcPath, jsDistPath);

  const indexHtml = fs.readFileSync(indexSrcPath, 'utf8');
  const $ = cheerio.load(indexHtml);

  $('link[rel="canonical"]').remove();
  $('head').prepend(`\n    <link rel="canonical" href="${manifest.canonical_url}">`);

  $('.coord-display').text(`${myCoords.x} - ${myCoords.y}`);
  $('.crosshair').attr('transform', `translate(${myCoords.x}, ${myCoords.y})`);

  $('#links .neighbor-entry').each((i, el) => {
    const link = $(el).find('.neighbor-link');
    const coordCode = $(el).find('code.coord');
    
    if (link.length && coordCode.length) {
      const url = link.attr('href');
      const domain = new URL(url).hostname;
      const coords = calculateCoordinates(domain);
      const name = link.text();
      const id = i + 1;

      link.attr('data-id', id);
      coordCode.attr('data-id', id);
      coordCode.text(`${coords.x} - ${coords.y}`);
      
      const circle = $(`#neighbor-circle-${id}`);
      if (circle.length) {
        circle.attr('cx', coords.x);
        circle.attr('cy', coords.y);
        circle.attr('data-id', id);
        circle.find('title').text(`${name} (${coords.x} - ${coords.y})`);
      }

      const line = $(`#course-line-${id}`);
      if (line.length) {
        line.attr('x1', myCoords.x);
        line.attr('y1', myCoords.y);
        line.attr('x2', coords.x);
        line.attr('y2', coords.y);
        line.attr('data-id', id);
      }
    }
  });

  fs.writeFileSync(indexDistPath, $.html());
  console.log('Build complete: Independent CSS/JS logic applied.');
};

updateFiles();
