import cliProgress from 'cli-progress'
import Song from './song.js'

main().then(() => {}).catch(err => {
  console.error(err)
})

async function main() {
  const songs = [
    {
      artist: 'YOASOBI',
      title: '夜に駆ける'
    },
    {
      artist: 'ずっと真夜中でいいのに。',
      title: 'お勉強しといてよ'
    },
    {
      artist: '日向電工',
      title: 'ブリキノダンス'
    }
  ]
  const songsNumber = songs.length
  const progressBar = new cliProgress.SingleBar({
    format: 'Download Lyrics |' + '{bar}' + '| {percentage}% || {value}/{total} || {song}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
  progressBar.start(songsNumber, 0, {
    song: `${songs[0].title} - ${songs[0].artist}`
  })

  for (let i = 0; i < songsNumber; i++) {
    const currentSong = songs[i]
    const nextSong = songs[i + 1] || null
    const songObj = new Song(currentSong.artist, currentSong.title)
    // Promise.all()を利用したほうが効率的だが、スクレイピングの間隔制御ができない
    await songObj.fetchLyric()
    progressBar.increment({
      song: nextSong ? `${nextSong.title} - ${nextSong.artist}`  : 'Finished'
    })
  }

  progressBar.stop()
}
