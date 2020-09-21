const path = require('path');
const { createE2ECoverage } = require('../lib');

const demoFixtures = path.join(__dirname, './data/fixtures/demo01');
const demoExpects = path.join(__dirname, './data/expects/demo01_coverage');

const globPattern = path.join(demoFixtures, '/**/*.json');
const reporterDir = path.join(demoExpects).replace(/ /g, '\\ ');

console.info('准备生成端对端自动化测试报告！', globPattern, reporterDir);

createE2ECoverage(globPattern, {
  dir: reporterDir,
})
  .then(data => {
    console.info(`生成端对端自动化测试报告成功！可以在此查看更多内容： ${data.reporterDir}`);
  })
  .catch(err => {
    console.error(`生成端对端自动化测试报告失败！err: ${err.message || err}`);
  });
