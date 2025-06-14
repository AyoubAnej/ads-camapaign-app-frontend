/**
 * Helper functions for JWT token handling
 */

/**
 * Decodes a JWT token and returns the payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJWT = (token: string): any => {
  try {
    // JWT tokens are split into three parts: header.payload.signature
    const base64Url = token.split('.')[1]; // Get the payload part
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Extracts the advertiser ID from a JWT token
 * @param token JWT token string
 * @returns Advertiser ID as number or null if not found
 */
export const getAdvertiserIdFromToken = (token: string): number | null => {
  try {
    const decodedToken = decodeJWT(token);
    if (!decodedToken) return null;
    
    // Check for NameIdentifier claim which might contain the advertiser ID
    // Based on the JWT token structure we're seeing in the logs
    const nameIdentifier = 
      decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
      decodedToken.nameid || 
      decodedToken.sub || 
      decodedToken.NameIdentifier;
    
    // Log for debugging
    console.log('JWT Token claims:', decodedToken);
    console.log('Extracted nameIdentifier:', nameIdentifier);
    
    if (nameIdentifier) {
      // Try to parse as number if it's a string
      return typeof nameIdentifier === 'number' ? nameIdentifier : parseInt(nameIdentifier, 10);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting advertiser ID from token:', error);
    return null;
  }
};
