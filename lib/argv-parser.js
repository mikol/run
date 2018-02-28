const argumentRegExp = /^(-{0,2})(?:([^-].*?)(?:=(.*))?)?$/
const booleanTrueRegExp = /^(?:true|1)$/i
const decimalRegExp = /^[-+]?(?:(?:(?:0|[1-9][0-9]*)(?:\.[0-9]*)?)|(?:\.[0-9]*))(?:[eE][-+]?[0-9]+)?$/
const hexidecimalRegExp = /^0x[0-9a-f]+$/
const negationRegExp = /^no-([^-].*)$/

class ArgvParser {
  constructor(input, options = {}) {
    const aliases = {'-': '-', '--': '--'}

    if (options.aliases) {
      for (const key in options.aliases) {
        aliases[key] = key

        const x = options.aliases[key]

        if (Array.isArray(x)) {
          for (let i = 0, ni = x.length; i < ni; ++i) {
            aliases[x[i]] = key
          }
        } else {
          aliases[x] = key
        }
      }
    }

    this.aliases = aliases
    this.cache = []
    this.defaults = options.defaults
    this.validate = options.validate ? (k, v) => options.validate(k, v) : () => true
    this.input = input
    this.output = Object.assign({'': [], '-': false, '--': []}, this.defaults)
  }

  isBoolean(key) {
    return typeof this.defaults[key] === 'boolean'
  }

  isString(key) {
    return typeof this.defaults[key] === 'string'
  }

  parseKey(key) {
    const k = (negationRegExp.exec(key) || [, key])[1]
    if (k in this.aliases) {
      return this.aliases[k]
    }

    return key
  }

  parseValue(key, value, isBoolean) {
    if (this.isBoolean(key)) {
      return booleanTrueRegExp.test(value)
    }

    if (this.isString(key)) {
      return value
    }

    if (decimalRegExp.test(value) || hexidecimalRegExp.test(value)) {
      return Number(value)
    }

    return isBoolean ? true : value
  }

  set(index, hyphen, key, value) {
    const input = this.input
    const n = input.length
    const next = this.parseInput(index + 1)
    const output = this.output

    if (!hyphen && key) {
      output[''].push(key)
      return index
    }

    if (hyphen === '-' && key.length > 1) {
      const ni = key.length - 1
      let i = 0

      for (; i < ni; ++i) {
        const k = this.parseKey(key[i])
        const v = key.slice(i + 1)
        const p = this.parseValue(k, v, true)

        if (this.validate(k, p)) {
          output[k] = p
          if (typeof v === 'number') {
            i = -1
            break
          }
        }
      }

      if (i > -1) {
        this.set(index, hyphen, key[i], value)
      }

      return index
    }

    if (hyphen === '-' || hyphen === '--') {
      if (key) {
        const k = this.parseKey(key)
        const isBoolean = this.isBoolean(k) || !!next.hyphen
        const i = value != null || isBoolean ? index : index + 1
        const v = value != null ? value : (isBoolean ? true : next.key)

        if (this.validate(k, v)) {
          this.output[k] = this.parseValue(k, v)
          return i
        }

        return index
      }

      if (hyphen === '--') {
        for (let i = index + 1; i < n; ++i) {
          output['--'].push(input[i])
        }

        return n
      }

      if (hyphen === '-') {
        output['-'] = true
        return index
      }
    }

    throw Error(`Unexpected: ${input[index]}`)
  }

  parseInput(index) {
    const cached = this.cache[index]
    if (!cached) {
      const [, hyphen, key, value] = argumentRegExp.exec(this.input[index])
      return this.cache[index] = {hyphen, key, value}
    }

    return cached
  }

  parse() {
    for (let index = 0, n = this.input.length; index < n; ++index) {
      const {hyphen, key, value} = this.parseInput(index)
      index = this.set(index, hyphen, key, value)
    }

    return this.output
  }
}

module.exports = ArgvParser
