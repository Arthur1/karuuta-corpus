import axios from 'axios'
import jsdom from 'jsdom'
import fs from 'fs/promises'
import path from 'path'
import sanitize from 'sanitize-filename'
import deepcopy from 'deepcopy'
import MecabGyp from 'mecab-gyp'
import sleep from './sleep.js'

const { JSDOM } = jsdom
axios.defaults.baseURL = 'https://utaten.com/'
const mecabGyp = new MecabGyp('--dicdir=/usr/local/lib/mecab/dic/ipadic/')

export default class Song {
  constructor(artist, title) {
    this.artist = artist
    this.title = title
    this.url = null
    this.htmlLyricPath = path.join('resources', 'html_lyrics', sanitize(`${this.artist}___${this.title}.html`))
    this.rawLyricPath = path.join('resources', 'raw_lyrics', sanitize(`${this.artist}___${this.title}.txt`))
  }

  /**
   * 歌詞のURLを取得
   * @async
   */
  async fetchUrl() {
    const url = '/lyric/search'
    const options = {
      params: {
        sort: 'popular_sort',
        artist_name: this.artist,
        title: this.title
      },
      responseType: 'document'
    }
    const res = await axios.get(url, options)
    await sleep(1000)
    const dom = new JSDOM(res.data)
    this.url = dom.window.document.querySelector('.lyricList__beginning > a').getAttribute('href')
  }

  /**
   * 歌詞を取得してダウンロード
   * @async
   */
  async fetchLyric() {
    if (await this.rawLyricExists()) return
    if (! this.url) await this.fetchUrl()
    const options = {
      responseType: 'document'
    }
    const res = await axios.get(this.url, options)
    await sleep(1000)
    const dom = new JSDOM(res.data)
    const lyricDom = dom.window.document.querySelector('.hiragana')
    await Promise.all([this.saveHtmlLyric(lyricDom), this.saveRawLyric(lyricDom)])
  }

  /**
   * HTML版歌詞(読みを含む)を書き出し
   * @async
   * @param {Element} lyricDom  歌詞要素のDOM Node
   */
  async saveHtmlLyric(lyricDom) {
    const htmlLyric = lyricDom.innerHTML.trim()
    await fs.writeFile(this.htmlLyricPath, htmlLyric)
  }

  /**
   * テキスト版歌詞を書き出し
   * @async
   * @param {Element} lyricDom  歌詞要素のDOM Node
   */
  async saveRawLyric(lyricDom) {
    const clonedLyricDom = deepcopy(lyricDom)
    clonedLyricDom.querySelectorAll('.rt').forEach(el => el.innerHTML = '')
    const rawLyric = clonedLyricDom.textContent.trim()
    await fs.writeFile(this.rawLyricPath, rawLyric)
  }

  /**
   * テキスト版歌詞が存在するかどうか
   * @async
   * @return {Promise<Boolean>}
   */
  async rawLyricExists() {
    try {
      await this.loadRawLyric()
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * テキスト版歌詞をファイルから読み込む
   * @async
   */
  async loadRawLyric() {
    return await fs.readFile(this.rawLyricPath, 'utf-8')
  }

  /**
   * HTML版歌詞をファイルから読み込む
   * @async
   */
  async loadHtmlLyric() {
    return await fs.readFile(this.htmlLyricPath, 'utf-8')
  }
}
