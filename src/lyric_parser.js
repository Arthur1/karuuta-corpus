import MecabGyp from 'mecab-gyp'
import deepcopy from 'deepcopy'
import jsdom from 'jsdom'
import Song from './song.js'
import karuutaTerms from '../resources/karuuta_terms.json'

const { JSDOM } = jsdom
const mecabGyp = new MecabGyp('--dicdir=/usr/local/lib/mecab/dic/ipadic/')

export default class LyricParser {
  constructor(artist, title) {
    this.song = new Song(artist, title)
    this.terms = null
    this.rawLyric = null
    this.htmlLyric = null
  }

  async loadLyrics() {
    [this.rawLyric, this.htmlLyric] = await Promise.all([this.song.loadRawLyric(), this.song.loadHtmlLyric()])
  }

  async parse() {
    if (this.rawLyric === null || this.htmlLyric === null) await this.loadLyrics()
    const result = mecabGyp.parseAsNode(this.rawLyric)
    this.terms = result.map(term => term.feature.split(','))
  }

  async searchKaruutaTerm() {
    if (this.terms === null) await this.parse()
    const foundKarutaTerms = new Set()
    let htmlLyric = deepcopy(this.htmlLyric)
    for (let term of this.terms) {
      if (['BOS/EOS', '助詞', '助動詞', '接頭詞', '記号'].includes(term[0])) continue
      const result = karuutaTerms.find(karuutaTerm => {
        return term[6].includes(karuutaTerm.word) && term[7].includes(karuutaTerm.ruby)
      })
      if (!result) continue
      const beginPosition = htmlLyric.indexOf(`<span class="rb">${result.word}</span>`)
      if (beginPosition !== -1) {
        let target = htmlLyric.substring(beginPosition)
        const endPosition = target.indexOf('</span></span>')
        target = target.substring(0, endPosition + '</span></span>'.length)
        const dom = JSDOM.fragment(target)
        console.log(dom.querySelector('.rt').textContent)
        htmlLyric = htmlLyric.substring(beginPosition + endPosition + '</span></span>'.length + 1)
      }
      foundKarutaTerms.add(result)
    }
    console.log(foundKarutaTerms)
  }

  static kanaTo
}
