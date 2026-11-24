const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const PORT = 3045;
const PUBLIC = path.resolve(__dirname, 'public');
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
function json(res, code, value){res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function bodyJSON(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65536)throw new Error('Слишком большой запрос');}try{return JSON.parse(raw || '{}');}catch{throw new Error('Некорректный JSON в запросе');}}
async function staticFile(pathname, res){
  let decoded;try{decoded=decodeURIComponent(pathname);}catch{return json(res,400,{error:'Некорректный адрес'});}
  const filepath=path.resolve(PUBLIC,'.'+(decoded==='/'?'/index.html':decoded));
  if(!filepath.startsWith(PUBLIC+path.sep))return json(res,403,{error:'Доступ запрещён'});
  const ext=path.extname(filepath);
  if(!MIME[ext])return json(res,404,{error:'Файл не найден'});
  try{const bytes=await fs.readFile(filepath);res.writeHead(200,{'Content-Type':MIME[ext],'Cache-Control':'no-store'});res.end(bytes);}catch{json(res,404,{error:'Файл не найден'});}
}
const movies=[
 {id:1,title:'Письма с орбиты',genre:'Фантастика',year:2024,rating:8.3,duration:108,sessions:['12:30','18:00'],tags:['космос','приключения']},
 {id:2,title:'Лесной маршрут',genre:'Приключения',year:2025,rating:7.6,duration:96,sessions:['10:20','15:50'],tags:['природа','семья']},
 {id:3,title:'Загадка старой башни',genre:'Детектив',year:2023,rating:8.0,duration:112,sessions:['19:10'],tags:['тайна','расследование']},
 {id:4,title:'Второй сигнал',genre:'Фантастика',year:2026,rating:7.9,duration:104,sessions:['14:40','21:20'],tags:['технологии','драма']},
 {id:5,title:'Карта океана',genre:'Приключения',year:2022,rating:8.1,duration:101,sessions:[],tags:['море','экспедиция']}
];
async function handleApi(req,res,url){
 if(url.pathname==='/api/movies'&&req.method==='GET'){
   const list=url.searchParams.get('empty')==='1'?[]:movies;
   return json(res,200,{data:{movies:list},meta:{total:list.length,updatedAt:'2026-11-19T12:00:00Z'}});
 }
 return json(res,404,{error:'Маршрут API не найден'});
}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
    try{await handleApi(req,res,url);}catch(err){json(res,400,{error:err.message||'Ошибка данных'});}return;
  }
  if(req.method!=='GET')return json(res,405,{error:'Метод не поддерживается'});
  await staticFile(url.pathname,res);
});
server.listen(PORT,()=>console.log(`Откройте http://localhost:${PORT}`));
