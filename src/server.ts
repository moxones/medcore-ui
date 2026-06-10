import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');
const baseHostnames = [...new Set(['localhost', new URL(environment.apiUrl).hostname])];

const isHostAllowed = (host: string): boolean =>
  baseHostnames.some((base) => host === base || host.endsWith(`.${base}`));

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: baseHostnames.flatMap((base) => [base, `*.${base}`]),
});
app.set('trust proxy', true);

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  if (!isHostAllowed(req.hostname)) {
    res.status(403).send('Host no permitido');
    return;
  }

  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
