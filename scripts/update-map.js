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
  const manifestPath = path.join(__dirname, '../manifest.json');
  const indexPath = path.join(__dirname, '../index.html');
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const myDomain = new URL(manifest.canonical_url).hostname;
  const myCoords = calculateCoordinates(myDomain);
  
  manifest.coordinates = {
    x: parseFloat(myCoords.x),
    y: parseFloat(myCoords.y)
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Updated manifest.json coords: ${myDomain} -> (${myCoords.x}, ${myCoords.y})`);

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const $ = cheerio.load(indexHtml);

  // 1. Update own coordinates in text
  $('body > p:contains("Coordinates:") code').text(`${myCoords.x} - ${myCoords.y}`);
  
  // 2. Update own cross-hair position
  $('g[transform^="translate"]').attr('transform', `translate(${myCoords.x}, ${myCoords.y})`);

  // 3. Update neighbor links, SVG circles, and Course Lines
  $('#links .neighbor-entry').each((i, el) => {
    const link = $(el).find('a[class^="neighbor-link-"]');
    const coordCode = $(el).find('code.coord');
    
    if (link.length && coordCode.length) {
      const url = link.attr('href');
      const domain = new URL(url).hostname;
      const coords = calculateCoordinates(domain);
      const name = link.text();
      const id = link.attr('class').match(/neighbor-link-(\d+)/)[1];

      console.log(`Updating ${name} (${domain}) -> ${coords.x} - ${coords.y}`);

      // Update text display
      coordCode.text(`${coords.x} - ${coords.y}`);
      
      // Update SVG circle
      const circle = $(`#neighbor-circle-${id}`);
      if (circle.length) {
        circle.attr('cx', coords.x);
        circle.attr('cy', coords.y);
        circle.find('title').text(`${name} (${coords.x} - ${coords.y})</title>`);
      }

      // Update Course Line
      const line = $(`#course-line-${id}`);
      if (line.length) {
        line.attr('x1', myCoords.x);
        line.attr('y1', myCoords.y);
        line.attr('x2', coords.x);
        line.attr('y2', coords.y);
      }
    }
  });

  fs.writeFileSync(indexPath, $.html());
  console.log('Updated index.html successfully using cheerio.');
};

updateFiles();
