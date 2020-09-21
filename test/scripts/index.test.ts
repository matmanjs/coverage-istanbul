import 'mocha';
import { expect } from 'chai';

import * as coverageIstanbul from '../../src/index';

describe('./index.ts', () => {
  it('export should be correct', () => {
    expect(coverageIstanbul).to.have.all.keys(
      'createE2ECoverage',
    );
  });
});
