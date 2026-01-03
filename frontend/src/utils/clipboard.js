/**
 * Clipboard Utility
 * Provides fallback methods for clipboard operations on non-HTTPS contexts
 */

/**
 * Copy text to clipboard with fallback for non-HTTPS
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export const copyToClipboard = async (text) => {
  // Try modern Clipboard API first (requires HTTPS or localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (err) {
      console.warn('Clipboard API failed, using fallback:', err)
    }
  }

  // Fallback for HTTP or older browsers
  return fallbackCopyToClipboard(text)
}

/**
 * Read text from clipboard with fallback for non-HTTPS
 * @returns {Promise<string>}
 */
export const readFromClipboard = async () => {
  // Try modern Clipboard API first (requires HTTPS or localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      return await navigator.clipboard.readText()
    } catch (err) {
      console.warn('Clipboard API failed, using fallback:', err)
    }
  }

  // Fallback: Cannot read from clipboard on HTTP, throw error
  throw new Error('Clipboard read requires HTTPS or user must paste manually')
}

/**
 * Fallback method using execCommand (deprecated but works on HTTP)
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
const fallbackCopyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    // Create temporary textarea
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-999999px'
    textarea.style.top = '-999999px'
    textarea.setAttribute('readonly', '')
    
    document.body.appendChild(textarea)
    
    try {
      // Select the text
      textarea.select()
      textarea.setSelectionRange(0, textarea.value.length)
      
      // Copy using execCommand (works on HTTP)
      const successful = document.execCommand('copy')
      
      if (successful) {
        resolve()
      } else {
        reject(new Error('execCommand copy failed'))
      }
    } catch (err) {
      reject(err)
    } finally {
      // Clean up
      document.body.removeChild(textarea)
    }
  })
}

/**
 * Check if clipboard is available
 * @returns {boolean}
 */
export const isClipboardAvailable = () => {
  return !!(navigator.clipboard && window.isSecureContext)
}

export default {
  copyToClipboard,
  readFromClipboard,
  isClipboardAvailable
}
