// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import istanbul, { Collector } from 'istanbul';

const { TreeSummarizer } = istanbul;

// 参考 istanbul/tree-summarizer.js
interface TreeNode {
  name: string;
  fullName: string;
  kind: string;
  parent: TreeNode;
  children: TreeNode[];
  fullPath: () => string;

  metrics: IMetrics;
}

interface IMetrics {
  lines: {
    pct: string;
  };

  statements: {
    pct: string;
  };

  functions: {
    pct: string;
  };

  branches: {
    pct: string;
  };
}

interface TreeSummary {
  root: TreeNode;
}

interface IPathMap {
  [key: string]: TreeNode;
}

export interface ICoverageMap {
  [key: string]: any;
}

export interface ICoverageResultInfo {
  lines: string;
  statements: string;
  functions: string;
  branches: string;
}
/**
 * 获得 TreeSummary
 * @param collector
 */
function getTreeSummary(collector: Collector): TreeSummary {
  const summarizer = new TreeSummarizer();

  collector.files().forEach(function (key: string) {
    summarizer.addFileCoverageSummary(
      key,
      istanbul.utils.summarizeFileCoverage(collector.fileCoverageFor(key)),
    );
  });

  return summarizer.getTreeSummary();
}

/**
 * 获得 TreeSummary map
 * @param treeSummary
 */
function getPathMap(treeSummary: TreeSummary): IPathMap {
  const ret: IPathMap = {};

  function walker(node: TreeNode) {
    ret[node.fullPath()] = node;
    node.children.forEach(function (child: TreeNode) {
      walker(child);
    });
  }

  walker(treeSummary.root);

  return ret;
}

/**
 * 合并不同的覆盖率文件，并生成新的结果
 *
 * @param {Object} obj 要追加的覆盖率信息
 * @param {Object} coverage 历史累积的覆盖率信息
 * @return {Object} 新累积的覆盖率信息
 */
export function mergeClientCoverage(obj: any, coverage: ICoverageMap): ICoverageMap {
  if (!coverage) {
    coverage = {};
  }

  if (!obj) {
    return coverage;
  }

  Object.keys(obj).forEach(function (filePath) {
    const original = coverage[filePath];
    const existResult = obj[filePath];

    let result;

    if (original) {
      result = istanbul.utils.mergeFileCoverage(original, existResult);
    } else {
      result = existResult;
    }

    coverage[filePath] = result;
  });

  return coverage;
}

/**
 * 获得覆盖率信息
 *
 * @param collector
 */
export function getCoverageInfo(collector: Collector): ICoverageResultInfo {
  const treeSummary = getTreeSummary(collector);
  const pathMap = getPathMap(treeSummary);

  const filePath = treeSummary.root.fullPath();
  const outputNode = pathMap[filePath];

  return {
    lines: outputNode.metrics.lines.pct,
    statements: outputNode.metrics.statements.pct,
    functions: outputNode.metrics.functions.pct,
    branches: outputNode.metrics.branches.pct,
  };
}
