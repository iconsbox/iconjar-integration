/**
 Walk directory,
 list tree without regex excludes
 */
const fs = require('fs');
const path = require('path');

const walk = (dir, regExcludes, done) => {
  let results = [];

  // eslint-disable-next-line consistent-return
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);

    let pending = list.length;
    if (!pending) return done(null, results);

    list.forEach(file => {
      file = path.join(dir, file);

      let excluded = false;
      const len = regExcludes.length;
      let i = 0;

      for (; i < len; i++) {
        if (file.match(regExcludes[i])) {
          excluded = true;
        }
      }

      // Add if not in regExcludes
      if (excluded === false) {
        results.push(file);

        // Check if its a folder
        // eslint-disable-next-line no-shadow
        fs.stat(file, (err, stat) => {
          if (stat && stat.isDirectory()) {
            // If it is, walk again
            walk(file, regExcludes, (err, res) => {
              results = results.concat(res);

              if (!--pending) {
                done(null, results);
              }
            });
          } else if (!--pending) {
            done(null, results);
          }
        });
      } else if (!--pending) {
        done(null, results);
      }
    });
  });
};

const regExcludes = [/dist/, /config/, /sprite/, /component/, /index\.js/, /js\/lib\.js/, /node_modules/, /\.DS_Store/];

function substringBetween(s, a, b) {
  const p = s.indexOf(a) + a.length;
  return s.substr(p, s.indexOf(b) - p);
}

const move = (oldPath, newPath, callback) => {
  fs.rename(oldPath, newPath, err => {
    if (err) {
      if (err.code === 'EXDEV') {
        copy();
      } else {
        callback(err);
      }
      return;
    }
    callback();
  });

  function copy() {
    const readStream = fs.createReadStream(oldPath);
    const writeStream = fs.createWriteStream(newPath);

    readStream.on('error', callback);
    writeStream.on('error', callback);

    readStream.on('close', () => {
      fs.unlink(oldPath, callback);
    });

    readStream.pipe(writeStream);
  }
};

walk('./packages', regExcludes, async (err, results) => {
  if (err) {
    throw err;
  }

  console.log(typeof results);

  results.forEach(item => {
    if(item.indexOf('.svg') > -1 ) {
      const name = substringBetween(item, '/src/', '/index.svg');
      const path = substringBetween(item, '/packages/', '/src');
      const newPath = `./packages/${path}/${name}.svg`;

      move(item, newPath, (error) => {
        if (!error) {
          console.log('moved');
        } else {
          console.log(error);
        }
      });
    }
  });
});
