/**
 * Vercel refuses a request body over 4.5 MB before the route even runs,
 * with a bare 413 the form cannot explain ("Something went wrong"). The
 * poster travels as base64 inside JSON alongside the form fields, so the
 * image itself is held to 4.2 million characters (about 3.1 MB of JPEG).
 * Shared by the form, which shrinks the image to fit, and the routes.
 */
export const MAX_IMAGE_CHARS = 4_200_000;
