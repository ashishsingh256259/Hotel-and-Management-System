# JWT signing configuration

Set `JWT_SECRET` in the server environment before starting the application. It must be a cryptographically random secret with at least 32 characters. Example generation: `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.

Do not commit the generated value, and configure the same value for all server instances. Changing it invalidates existing JWT sessions. The server now refuses to start without a valid secret; this is intentional.

Run `npm run lint` and `npm run build` after installing dependencies. Exercise admin/customer login and authenticated endpoints in staging before merging.
