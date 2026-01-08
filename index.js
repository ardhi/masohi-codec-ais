import Ais from './src/ais.js'

/**
 * Plugin factory
 *
 * @param {string} pkgName - NPM package name
 * @returns {class}
 */
async function factory (pkgName) {
  const me = this

  /**
   * MasohiCodecAis class
   *
   * @class
   */
  class MasohiCodecAis extends this.app.baseClass.Base {
    static alias = 'codec-ais'
    static dependencies = ['masohi', 'masohi-codec']

    constructor () {
      super(pkgName, me.app)
    }

    init = async () => {
    }

    createDecoder = () => {
      return new Ais()
    }
  }

  return MasohiCodecAis
}

export default factory
