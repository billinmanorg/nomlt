import { createServer } from 'node:http';
import { Readable } from 'node:stream';
// Caller must supply a verified proxy-address resolver; never trust arbitrary X-Forwarded-For.
export function createInquiryServer(handler, resolveClientAddress) {
 const server = createServer(async (req, res) => {
  try {
   const request = new Request('https://inquiry.invalid' + req.url, { method:req.method, headers:req.headers, ...(!['GET','HEAD'].includes(req.method) ? {body:Readable.toWeb(req),duplex:'half'} : {}) });
   const response=await handler(request,{clientAddress:resolveClientAddress?.(req)});
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  } catch { if(!res.headersSent) res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"message":"Receipt could not be confirmed."}'); }
 });
 server.requestTimeout=15000;server.headersTimeout=10000;server.maxHeadersCount=30;server.maxConnections=32;
 return server;
}
