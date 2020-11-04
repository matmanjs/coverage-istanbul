import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import istanbul from 'istanbul';
import glob from 'glob';
import istanbulLibCoverage from 'istanbul-lib-coverage';
import istanbulLibSourceMaps from 'istanbul-lib-source-maps';

import { getCoverageInfo, ICoverageMap, ICoverageResultInfo, mergeClientCoverage } from './util';

const mapStore = istanbulLibSourceMaps.createSourceMapStore({});

export interface ICreateE2ECoverageOpts {
  dir?: string;
}

export interface IE2ECoverageResult {
  data: ICoverageResultInfo,
  reporterDir: string,
}

/**
 * 生成覆盖率结果
 *
 * @param {String} globPattern glob 这个组件使用到的文件匹配规则
 * @param {Object} [opts]
 * @param {String} [opts.dir] 覆盖率文件输出目录，默认值为 ./coverage
 */
export function createE2ECoverage(
  globPattern: string,
  opts: ICreateE2ECoverageOpts
): Promise<IE2ECoverageResult> {
  return new Promise((resolve, reject) => {
    const collector = new istanbul.Collector();
    let coverage: ICoverageMap;

    // options is optional
    glob(globPattern, {}, function (err, files) {
      // console.log(files);
      if (err) {
        return reject(err);
      }

      // 如果没有过滤出文件，则返回错误
      if (!files || !files.length) {
        return reject(new Error(`Not exist files by pattern=${globPattern}`));
      }

      // 合并不同的覆盖率生产物
      files.forEach(file => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const fileData = JSON.parse(fs.readFileSync(file));
        coverage = mergeClientCoverage(fileData, coverage);
      });

      // console.log(coverage)

      const coverageMap = istanbulLibCoverage.createCoverageMap(coverage);
      const transformed = mapStore
        .transformCoverage(coverageMap)
        .then(result => {
          // console.log(JSON.stringify(transformed['map']));
          // console.log(JSON.parse(JSON.stringify(result)))
          const final_coverage = JSON.parse(JSON.stringify(result));

          // 部分项目coverage_out转换出来的final_coverage会被挂载在data上面，此处做兼容
          const final_coverage_comp: any = {};
          Object.keys(final_coverage).forEach((key) => {
              if (final_coverage[key].data) {
                  final_coverage_comp[key] = final_coverage[key].data;
              } else {
                  final_coverage_comp[key] = final_coverage[key];
              }
          });
          // 追加
          collector.add(final_coverage_comp);

          // 获取关键信息
          const coverageInfo = getCoverageInfo(collector);
          // console.log(coverageInfo);

          // 输出产物
          const sync = true;
          const reporter = new istanbul.Reporter();
          reporter.dir = opts?.dir || './coverage';
          reporter.addAll(['lcovonly', 'clover', 'cobertura', 'text-summary']);
          reporter.write(collector, sync, function () {
            // 注意 ts 下设置  "esModuleInterop": true 之后使用 html 则会报错的，
            // 因此在这里保护一下，但还是没解决本质问题，待后续解决
            const reporterForHtml = new istanbul.Reporter();
            reporterForHtml.dir = reporter.dir;
            reporterForHtml.add('html');

            try {
              reporterForHtml.write(collector, sync, function () {
                resolve({
                  data: coverageInfo,
                  reporterDir: reporter.dir,
                });
              });
            } catch (err) {
              if (process.env.DEBUG_COVERAGE) {
                console.log('--reporterForHtml err--', err);
              }
              console.log('Try to write html for coverage reporter failed!', (err?.message || err));

              resolve({
                data: coverageInfo,
                reporterDir: reporter.dir,
              });
            }
          });
        })
        .catch(err => {
          reject(err);
        });

      if (process.env.DEBUG_COVERAGE) {
        console.log('--typeof transformed--', typeof transformed);
      }
    });
  });
}
