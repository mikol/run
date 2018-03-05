module.exports = {
  closure() {
    console.log(this.e === 'npm run log -- e')
  },

  log: console.log,

  pree() {
    console.log('pre')
  },

  e: 'npm run log -- e',

  poste() {
    console.log('post')
  },

  noop() {},

  pkg() {
    console.log('scripts')
  },

  throw() {
    throw new Error('Erroneous monk!')
  },

  timeout() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timed out'))
      }, 5000)
    })
  },

  wait() {
    console.log(new Date().toISOString())
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(new Date().toISOString())
        resolve()
      }, 100)
    })
  }
}
