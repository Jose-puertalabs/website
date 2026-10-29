import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  try {
    const path=resolve(root,`.${decodeURIComponent(new URL(req.url,'http://localhost').pathname)}`);
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return}
    const info=await stat(path);
    if(info.isDirectory()&&!new URL(req.url,'http://localhost').pathname.endsWith('/')){res.writeHead(301,{Location:new URL(req.url,'http://localhost').pathname+'/'}).end();return}
    const file=info.isDirectory()?resolve(path,'index.html'):path;
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(body);
  } catch {res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found')}
});
server.listen(4173,'127.0.0.1',()=>console.log('Puerta local preview: http://127.0.0.1:4173'));
