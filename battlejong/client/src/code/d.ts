// Declare a type so that we can import image files as modules.  Without this, you'd be forced to use
// require() instead.
declare module "*.png" {
 const value: any;
 export = value;
}
