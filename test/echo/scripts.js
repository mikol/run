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
  }
}
