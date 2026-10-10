import qs from 'qs';
import morgan from 'morgan';
import express from 'express';

import env from './config/env';
// import { apiRoutes } from './routes';
import cookieParser from 'cookie-parser';
import notFound from './middlewares/notFound';
import healthCheck from './middlewares/healthCheck';

const app = express();

app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set('query parser', (str: string) => qs.parse(str));

// app.use('/api', apiRoutes);
app.use('/health-check', healthCheck);

app.all(/.*/, notFound);

export default app;
