import assert from 'node:assert/strict';
import sinon from 'sinon';

import type MarkdownIt from 'markdown-it';

import markdown from 'markdown-it';
import wikirefs_plugin from '../../src';

let md: MarkdownIt;
let env: any;
let mockOpts: any;
let fakePrepFile: any;
let fakeAddAttr: any;
let fakeAddLink: any;
let fakeAddEmbed: any;

// todo: 
// - add test to illustrate metadata functions shouldn't be called inside an embed (nest inside `if (!env.cycleStack)`)
// - add test to illustrate that metadata will be called regardless if 'resolveHtmlHref'/'resolveHtmlText' found anything.

describe('metadata', () => {

  describe('w/', () => {

    beforeEach(() => {
      mockOpts = {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        resolveHtmlText: (env: any, fname: string) => 'File With Wikilink',
        resolveHtmlHref: (env: any, fname: string) => '/file-with-wikilink',
        prepFile: (env: any) => { return; },
        addAttr: (env: any, key: string, value: string) => { return; },
        addLink: (env: any, key: string, value: string) => { return; },
        addEmbed: (env: any, key: string, value: string) => { return; },
        /* eslint-enable @typescript-eslint/no-unused-vars */
      };
      fakePrepFile = sinon.replace(mockOpts, 'prepFile', sinon.fake.returns({}));
      fakeAddAttr = sinon.replace(mockOpts, 'addAttr', sinon.fake.returns({}));
      fakeAddLink = sinon.replace(mockOpts, 'addLink', sinon.fake.returns({}));
      fakeAddEmbed = sinon.replace(mockOpts, 'addEmbed', sinon.fake.returns({}));
      md = markdown().use(wikirefs_plugin, mockOpts);
      env = { absPath: '/tests/fixtures/file-with-wikilink.md' };
    });

    it('prepfile before renders', () => {
      // first round //
      md.render('[[fname-b]].', env);
      assert.strictEqual(fakePrepFile.called, true);
      assert.strictEqual(fakeAddLink.called, true);
      assert.deepStrictEqual(fakeAddLink.getCall(0).args, [env, '', 'fname-b']);
      assert.strictEqual(fakePrepFile.calledBefore(fakeAddLink), true);

      // second round //
      md.render('[[fname-a]].', env);
      assert.strictEqual(fakePrepFile.called, true);
      assert.deepStrictEqual(fakeAddLink.getCall(1).args, [env, '', 'fname-a']);
      assert.strictEqual(fakePrepFile.calledBefore(fakeAddLink), true);
    });

    describe('wikiattr', () => {

      it('single; base', () => {
        md.render('attrtype::[[fname-a]]\n', env);
        assert.strictEqual(fakeAddAttr.called, true);
        assert.deepStrictEqual(fakeAddAttr.getCall(0).args, [env, 'attrtype', 'fname-a']);
      });

      it('multi-link; base', () => {
        md.render('attrtype::[[fname-a]],[[fname-b]],[[fname-c]]\n', env);
        assert.strictEqual(fakeAddAttr.called, true);
        assert.deepStrictEqual(fakeAddAttr.getCall(0).args, [env, 'attrtype', 'fname-a']);
        assert.deepStrictEqual(fakeAddAttr.getCall(1).args, [env, 'attrtype', 'fname-b']);
        assert.deepStrictEqual(fakeAddAttr.getCall(2).args, [env, 'attrtype', 'fname-c']);
      });

      it('multi-type, multi-link; basic', () => {
        md.render('attrtype1::[[fname-a]],[[fname-b]],[[fname-c]]\nattrtype2::\n- [[fname-a]]\n- [[fname-b]]\n- [[fname-c]]\n', env);
        // first round
        assert.deepStrictEqual(fakeAddAttr.getCall(0).args, [env, 'attrtype1', 'fname-a']);
        assert.deepStrictEqual(fakeAddAttr.getCall(1).args, [env, 'attrtype1', 'fname-b']);
        assert.deepStrictEqual(fakeAddAttr.getCall(2).args, [env, 'attrtype1', 'fname-c']);
        // second round
        assert.deepStrictEqual(fakeAddAttr.getCall(3).args, [env, 'attrtype2', 'fname-a']);
        assert.deepStrictEqual(fakeAddAttr.getCall(4).args, [env, 'attrtype2', 'fname-b']);
        assert.deepStrictEqual(fakeAddAttr.getCall(5).args, [env, 'attrtype2', 'fname-c']);
      });

    });

    describe('wikilink', () => {

      it('untyped; base', () => {
        md.render('[[fname-a]].', env);
        assert.strictEqual(fakeAddLink.called, true);
        assert.deepStrictEqual(fakeAddLink.getCall(0).args, [env, '', 'fname-a']);
      });
  
      it('untyped; labelled', () => {
        md.render('[[fname-a|label]].', env);
        assert.strictEqual(fakeAddLink.called, true);
        assert.deepStrictEqual(fakeAddLink.getCall(0).args, [env, '', 'fname-a']);
      });
  
      it('typed; base', () => {
        md.render(':linktype::[[fname-a]].', env);
        assert.strictEqual(fakeAddLink.called, true);
        assert.deepStrictEqual(fakeAddLink.getCall(0).args, [env, 'linktype', 'fname-a']);
      });
  
      it('typed; labelled', () => {
        md.render(':linktype::[[fname-a|label]].', env);
        assert.strictEqual(fakeAddLink.called, true);
        assert.deepStrictEqual(fakeAddLink.getCall(0).args, [env, 'linktype', 'fname-a']);
      });

    });

    describe('wikiembed', () => {

      it('base', () => {
        md.render('![[fname-a]]', env);
        assert.strictEqual(fakeAddEmbed.called, true);
        assert.deepStrictEqual(fakeAddEmbed.getCall(0).args, [env, 'fname-a']);
      });

    });

  });

});
