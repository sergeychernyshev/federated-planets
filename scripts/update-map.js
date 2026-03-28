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
  
  // 1. Process manifest.json
  const manifest = JSON.parse(fs.readFileSync(manifestSrcPath, 'utf8'));
  const myDomain = new URL(manifest.canonical_url).hostname;
  const myCoords = calculateCoordinates(myDomain);
  
  manifest.coordinates = {
    x: parseFloat(myCoords.x),
    y: parseFloat(myCoords.y)
  };
  
  fs.writeFileSync(manifestDistPath, JSON.stringify(manifest, null, 2));
  console.log(`Updated manifest.json coords: ${myDomain} -> (${myCoords.x}, ${myCoords.y})`);

  // 2. Process planet.css and map.js (just copy)
  fs.copyFileSync(cssSrcPath, cssDistPath);
  fs.copyFileSync(jsSrcPath, jsDistPath);

  // 3. Process index.html
  const indexHtml = fs.readFileSync(indexSrcPath, 'utf8');
  const $ = cheerio.load(indexHtml);

  // Update canonical URL
  $('link[rel="canonical"]').remove();
  $('head').prepend(`\n    <link rel="canonical" href="${manifest.canonical_url}">`);

  // Update own coordinates in text and crosshair
  $('.coord-display').text(`${myCoords.x} - ${myCoords.y}`);
  $('.crosshair').attr('transform', `translate(${myCoords.x}, ${myCoords.y})`);

  // Clear dynamic SVG containers
  const $courseLines = $('#map-course-lines');
  const $planets = $('#map-planets');
  $courseLines.empty();
  $planets.empty();

  // Process neighbor links and generate map markers
  $('#links .neighbor-entry').each((i, el) => {
    const link = $(el).find('.neighbor-link');
    if (!link.length) return;

    const url = link.attr('href');
    const domain = new URL(url).hostname;
    const coords = calculateCoordinates(domain);
    const name = link.text();
    const id = i + 1;

    // 1. Update/Add coordinate tag in list
    link.attr('data-id', id);
    let coordTag = $(el).find('code.coord');
    if (coordTag.length === 0) {
      $(el).append(` <code class="coord" data-id="${id}"></code>`);
      coordTag = $(el).find('code.coord');
    }
    coordTag.text(`${coords.x} - ${coords.y}`);
    coordTag.attr('data-id', id);

    // 2. Generate SVG Circle
    $planets.append(`
              <circle
                id="neighbor-circle-${id}"
                class="neighbor-circle"
                data-id="${id}"
                cx="${coords.x}"
                cy="${coords.y}"
                r="4"
              >
                <title>${name} (${coords.x} - ${coords.y})</title>
              </circle>`);

    // 3. Generate Course Line
    $courseLines.append(`
              <line
                id="course-line-${id}"
                class="course-line"
                data-id="${id}"
                x1="${myCoords.x}"
                y1="${myCoords.y}"
                x2="${coords.x}"
                y2="${coords.y}"
              ></line>`);

    console.log(`Generated marker for ${name} (${domain}) -> ${coords.x} - ${coords.y}`);
  });

  fs.writeFileSync(indexDistPath, $.html());
  console.log('Build complete: Dynamic map generation successful.');
};

updateFiles();
