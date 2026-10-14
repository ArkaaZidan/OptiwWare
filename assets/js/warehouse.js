(function(){
  'use strict';
  const STORE={products:'optiware.warehouse.products.v1',moves:'optiware.warehouse.moves.v1',daily:'optiware.warehouse.daily.v1'};
  const $=id=>$$ (id), id=()=>`p-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Number(n||0).toLocaleString('id-ID');
  const localTime=()=>new Date().toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false});
  const todayKey=()=>new Date().toLocaleDateString('sv-SE');
  let products=[],moves=[],daily={date:todayKey(),in:18,out:12},period='7';
  const names=[['Minyak Goreng 1L','MG001','Kebutuhan Rumah Tangga','A-01',5,10],['Gula Pasir 1kg','GP001','Makanan','A-02',8,15],['Tepung Terigu 1kg','TT001','Makanan','B-01',5,10],['Kecap Manis 600ml','KM001','Makanan','B-02',3,10],['Susu UHT 1L','SU001','Minuman','C-01',6,10],['Indomie Goreng 85g','ID001','Makanan','D-01',320,30],['Aqua 600ml','AQ001','Minuman','D-02',280,40],['Beras 5kg','BR001','Makanan','E-01',150,25],['Sabun Mandi 90g','SM001','Kebutuhan Rumah Tangga','F-01',92,20],['Kopi Bubuk 200g','KB001','Minuman','C-02',74,15]];
  function seed(){const out=[];for(let i=0;i<124;i++){const n=names[i%names.length],group=Math.floor(i/10);let stock,min;if(i<5){stock=n[4];min=n[5]}else if(i<35){stock=2+(i%7);min=12}else if(i<54){stock=0;min=10}else{stock=i===123?10:14+(i%2);min=stock===10?9:10}out.push({id:`seed-${i+1}`,name:n[0]+(i>=10?` ${group+1}`:''),sku:i<10?n[1]:`${n[1]}${String(i+1).padStart(3,'0')}`,category:n[2],stock,min,location:n[3]})}return out}
  function read(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch(_){return fallback}}
  function save(){localStorage.setItem(STORE.products,JSON.stringify(products));localStorage.setItem(STORE.moves,JSON.stringify(moves));localStorage.setItem(STORE.daily,JSON.stringify(daily))}
  function boot(){products=read(STORE.products,null)||seed();moves=read(STORE.moves,null)||[
    {id:id(),time:'31 Okt 14:20',sort:Date.now()-1000,kind:'Masuk',product:'Indomie Goreng 85g',sku:'ID001',qty:120,before:200,after:320,note:'Penerimaan pemasok',staff:'Widhi'},
    {id:id(),time:'31 Okt 13:45',sort:Date.now()-2000,kind:'Keluar',product:'Aqua 600ml',sku:'AQ001',qty:40,before:320,after:280,note:'Distribusi toko',staff:'Widhi'},
    {id:id(),time:'31 Okt 12:10',sort:Date.now()-3000,kind:'Masuk',product:'Beras 5kg',sku:'BR001',qty:50,before:100,after:150,note:'Penerimaan pemasok',staff:'Widhi'},
    {id:id(),time:'31 Okt 11:05',sort:Date.now()-4000,kind:'Keluar',product:'Minyak Goreng 1L',sku:'MG001',qty:30,before:220,after:190,note:'Distribusi toko',staff:'Widhi'},
    {id:id(),time:'31 Okt 10:30',sort:Date.now()-5000,kind:'Masuk',product:'Gula Pasir 1kg',sku:'GP001',qty:100,before:20,after:120,note:'Penerimaan pemasok',staff:'Widhi'}];daily=read(STORE.daily,{date:todayKey(),in:18,out:12});if(daily.date!==todayKey())daily={date:todayKey(),in:0,out:0};save()}
  function toast(text,type){webix.message({text,type:type||'success',expire:3200})}
  function status(p){return p.stock===0?'Habis':p.stock<=p.min?'Menipis':'Aman'}
  function badge(v){
    const cls=v==='Aman'?'badge-ok':v==='Menipis'?'badge-low':'badge-out';
    return `<span class="status-badge ${cls}"><span class="badge-dot"></span>${v}</span>`;
  }
  function kindBadge(v){
    const isMasuk=v==='Masuk';
    const cls=isMasuk?'badge-in':'badge-outflow';
    return `<span class="status-badge ${cls}"><span class="badge-arrow">${isMasuk?'↓':'↑'}</span>${v}</span>`;
  }
  function refresh(){save();renderStats();renderStock();renderMoves();renderProducts();renderHistory();renderInflow();renderOutflow();renderCondition();renderBar()}
  function statData(){const c={Aman:0,Menipis:0,Habis:0};products.forEach(p=>c[status(p)]++);return{units:products.reduce((s,p)=>s+Number(p.stock),0),counts:c,low:products.filter(p=>p.stock<=p.min)}}
  function renderStats(){const s=statData();if($('kpiProducts'))$('kpiProducts').setHTML(kpi('▣','Total Produk',fmt(products.length),'Produk terdaftar di gudang','#EAF1FF','#315DAD'));if($('kpiUnits'))$('kpiUnits').setHTML(kpi('▦','Total Stok Unit',fmt(s.units),'+12% dari bulan lalu','#E8F8F1','#10A879'));if($('kpiIn'))$('kpiIn').setHTML(kpi('↓','Barang Masuk Hari Ini',fmt(daily.in),'+6 dari kemarin','#FFF0E3','#FF7618'));if($('kpiOut'))$('kpiOut').setHTML(kpi('↑','Barang Keluar Hari Ini',fmt(daily.out),'-2 dari kemarin','#FEECEC','#EF4444'))}
  function kpi(icon,title,value,note,bg,color){return `<div class="kpi-card"><div class="kpi-head"><span>${title}</span><span class="kpi-icon" style="background:${bg};color:${color}">${icon}</span></div><div class="kpi-value">${value}</div><div class="kpi-note">${note}</div></div>`}
  function conditionPercent(key,s){const safe=products.length?Math.round(s.counts.Aman/products.length*100):0,low=products.length?Math.round(s.counts.Menipis/products.length*100):0;return key==='Aman'?safe:key==='Menipis'?low:Math.max(0,100-safe-low)}
  function renderCondition(){const s=statData(),chart=$('conditionChart');if(chart){chart.define('donutInnerText',fmt(products.length)+' Produk');chart.clearAll();chart.parse([{label:'Stok Aman',value:s.counts.Aman,color:'#10A879'},{label:'Stok Menipis',value:s.counts.Menipis,color:'#FF7618'},{label:'Stok Habis',value:s.counts.Habis,color:'#EF4444'}])}if($('conditionLegend'))$('conditionLegend').setHTML(`<div class="legend-row"><i class="legend-dot" style="background:#10A879"></i><div><strong>Stok Aman</strong>${fmt(s.counts.Aman)} produk</div><span class="legend-count">${conditionPercent('Aman',s)}%</span></div><div class="legend-row"><i class="legend-dot" style="background:#FF7618"></i><div><strong>Stok Menipis</strong>${fmt(s.counts.Menipis)} produk</div><span class="legend-count">${conditionPercent('Menipis',s)}%</span></div><div class="legend-row"><i class="legend-dot" style="background:#EF4444"></i><div><strong>Stok Habis</strong>${fmt(s.counts.Habis)} produk</div><span class="legend-count">${conditionPercent('Habis',s)}%</span></div>`)}
  const baseLabels=['25 Okt','26 Okt','27 Okt','28 Okt','29 Okt','30 Okt','31 Okt'];
  function barData(){let count=period==='30'?30:period==='month'?31:7;return Array.from({length:count},(_,i)=>({day:period==='7'?baseLabels[i]:`${i+1}`,masuk:period==='7'?[18,22,15,28,19,24,Number(daily.in)][i]:8+(i*7%23),keluar:period==='7'?[12,17,20,14,22,16,Number(daily.out)][i]:5+(i*11%20)}))}
  function renderBar(){if($('movementChart')){const data=barData(),max=Math.max(0,...data.map(d=>Math.max(d.masuk,d.keluar))),end=Math.max(40,Math.ceil(max/10)*10);$('movementChart').define('yAxis',{start:0,end,step:end/4});$('movementChart').clearAll();$('movementChart').parse(data)}}
  function renderStock(){if(!$('lowGrid'))return;const rows=statData().low.slice(0,5).map((p,i)=>({...p,no:i+1,status:status(p)}));$('lowGrid').clearAll();$('lowGrid').parse(rows)}
  function renderMoves(){if(!$('latestGrid'))return;$('latestGrid').clearAll();$('latestGrid').parse(moves.slice().sort((a,b)=>b.sort-a.sort).slice(0,8))}
  function renderProducts(){if(!$('productsGrid'))return;$('productsGrid').clearAll();$('productsGrid').parse(products.map(p=>({...p,status:status(p)})))}
  function renderHistory(){if(!$('historyGrid'))return;$('historyGrid').clearAll();$('historyGrid').parse(moves.slice().sort((a,b)=>b.sort-a.sort))}
  function updateComboOptions(viewId,opts){
    const select=$(viewId);
    if(!select)return;
    try{
      if(select.getList){
        const list=select.getList();
        if(list){
          list.clearAll();
          list.parse(opts);
          return;
        }
      }
      select.define('options',opts);
      if(select.render)select.render();
    }catch(_){}
  }
  function renderInflow(){
    const opts=products.map(p=>({id:p.id,value:`${p.name} (Stok: ${p.stock})`}));
    updateComboOptions('inflowProduct',opts);
    const grid=$('inflowGrid');
    if(grid){
      grid.clearAll();
      grid.parse(moves.filter(m=>m.kind==='Masuk').slice().sort((a,b)=>b.sort-a.sort));
    }
    const countEl=document.getElementById('inflowCount');
    if(countEl)countEl.textContent=fmt(daily.in);
  }
  function renderOutflow(){
    const opts=products.map(p=>({id:p.id,value:`${p.name} (Stok: ${p.stock})`}));
    updateComboOptions('outflowProduct',opts);
    const grid=$('outflowGrid');
    if(grid){
      grid.clearAll();
      grid.parse(moves.filter(m=>m.kind==='Keluar').slice().sort((a,b)=>b.sort-a.sort));
    }
    const countEl=document.getElementById('outflowCount');
    if(countEl)countEl.textContent=fmt(daily.out);
  }
  function setPage(page){
    $('views').setValue(page);
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
    const n=document.querySelector('.nav-items');
    if(n)n.classList.remove('open');
    if(page==='products')renderProducts();
    if(page==='history')renderHistory();
    if(page==='inflow')renderInflow();
    if(page==='outflow')renderOutflow();
  }
  function showAllProducts(){setPage('products')}
  function productForm(product){
    const edit=!!product,winId='productWin';
    if($(winId))$(winId).close();
    webix.ui({
      view:'window',id:winId,width:490,position:'center',modal:true,
      head:`<div style="display:flex;align-items:center;gap:10px;"><span style="display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--orange);color:#fff;font-weight:800;font-size:14px">${edit?'✎':'＋'}</span><span style="font-size:15px;font-weight:800;">${edit?'Edit Produk':'Tambah Produk Baru'}</span></div>`,
      body:{
        view:'form',id:'productForm',padding:22,elements:[
          {view:'text',name:'name',label:'Nama Produk',labelPosition:'top',required:true,placeholder:'Contoh: Minyak Goreng 1L',value:product?.name||''},
          {cols:[
            {view:'text',name:'sku',label:'SKU / Kode',labelPosition:'top',required:true,placeholder:'Contoh: MG001',value:product?.sku||''},
            {view:'select',name:'category',label:'Kategori',labelPosition:'top',value:product?.category||'Makanan',options:['Makanan','Minuman','Kebutuhan Rumah Tangga']}
          ]},
          {cols:[
            {view:'text',name:'stock',label:'Stok Awal',labelPosition:'top',type:'number',value:product?.stock??0},
            {view:'text',name:'min',label:'Batas Minimum',labelPosition:'top',type:'number',value:product?.min??10}
          ]},
          {view:'text',name:'location',label:'Lokasi Rak / Penyimpanan',labelPosition:'top',placeholder:'Contoh: A-01, B-02',value:product?.location||''},
          {height:10},
          {cols:[
            {},
            {view:'button',value:'Batal',width:95,click:()=>$(winId).close()},
            {view:'button',value:'Simpan Produk',css:'btn-add-product',width:140,click:()=>saveProduct(product)}
          ]}
        ]
      }
    }).show();
  }
  function saveProduct(old){const f=$('productForm'),v=f.getValues(),sku=String(v.sku||'').trim().toUpperCase(),stock=Number(v.stock),min=Number(v.min);if(!String(v.name||'').trim()||!sku)return toast('Nama produk dan SKU wajib diisi.','error');if(products.some(p=>p.sku.toUpperCase()===sku&&p.id!==old?.id))return toast('SKU sudah digunakan produk lain.','error');if(!Number.isInteger(stock)||stock<0||!Number.isInteger(min)||min<0)return toast('Stok dan batas minimum harus bilangan bulat nonnegatif.','error');const obj={id:old?.id||id(),name:String(v.name).trim(),sku,category:v.category,stock,min,location:String(v.location||'').trim()};if(old)products=products.map(p=>p.id===old.id?obj:p);else products.unshift(obj);$( 'productWin').close();refresh();toast(old?'Produk berhasil diperbarui.':'Produk berhasil ditambahkan.')}
  function deleteSelected(){const p=$('productsGrid').getSelectedItem();if(!p)return toast('Pilih produk yang akan dihapus.','error');webix.confirm({title:'Hapus produk?',text:`Produk ${esc(p.name)} akan dihapus. Riwayat mutasi tetap tersimpan.`,ok:'Hapus',cancel:'Batal'}).then(()=>{products=products.filter(x=>x.id!==p.id);refresh();toast('Produk dihapus.')}).catch(()=>{})}
  function movementForm(kind){
    const winId='moveWin';
    if($(winId))$(winId).close();
    const isMasuk=kind==='Masuk';
    const options=products.map(p=>({id:p.id,value:`${p.name} (Stok: ${p.stock})`}));
    webix.ui({
      view:'window',id:winId,width:480,position:'center',modal:true,
      head:`<div style="display:flex;align-items:center;gap:10px;"><span style="display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:${isMasuk?'#10A879':'#EF4444'};color:#fff;font-weight:800;font-size:14px">${isMasuk?'↓':'↑'}</span><span style="font-size:15px;font-weight:800;">Catat Barang ${kind}</span></div>`,
      body:{
        view:'form',id:'moveForm',padding:22,elements:[
          {view:'richselect',name:'product',label:'Pilih Produk',labelPosition:'top',required:true,options,placeholder:'-- Pilih produk dari katalog --'},
          {view:'text',name:'qty',label:`Jumlah Barang ${kind} (Unit)`,labelPosition:'top',type:'number',required:true,placeholder:'Contoh: 25'},
          {view:'textarea',name:'note',label:isMasuk?'Catatan / Pemasok':'Catatan / Tujuan Toko',labelPosition:'top',height:75,placeholder:isMasuk?'Contoh: Penerimaan dari Pemasok Utama':'Contoh: Distribusi Toko Alfamart 02'},
          {height:10},
          {cols:[
            {},
            {view:'button',value:'Batal',width:95,click:()=>$(winId).close()},
            {view:'button',value:isMasuk?'＋ Simpan Masuk':'＋ Simpan Keluar',css:isMasuk?'btn-save-inflow':'btn-save-outflow',width:150,click:()=>saveMove(kind)}
          ]}
        ]
      }
    }).show();
  }
  function saveMove(kind){const values=$('moveForm').getValues(),p=products.find(x=>x.id===values.product),qty=Number(values.qty);if(!p)return toast('Pilih produk terlebih dahulu.','error');if(!Number.isInteger(qty)||qty<=0)return toast('Jumlah harus berupa bilangan bulat positif.','error');if(kind==='Keluar'&&qty>p.stock)return toast(`Stok tidak mencukupi. Tersedia ${fmt(p.stock)} unit.`,'error');const before=p.stock;p.stock+=kind==='Masuk'?qty:-qty;const move={id:id(),time:localTime(),sort:Date.now(),kind,product:p.name,sku:p.sku,qty,before,after:p.stock,note:String(values.note||'').trim()||(kind==='Masuk'?'Penerimaan barang':'Distribusi toko'),staff:'Widhi'};moves.unshift(move);if(kind==='Masuk')daily.in+=qty;else daily.out+=qty;$( 'moveWin').close();refresh();toast(`Barang ${kind.toLowerCase()} berhasil dicatat.`)}
  function saveQuickMove(kind){
    const formId=kind==='Masuk'?'inflowPageForm':'outflowPageForm';
    const f=$(formId);
    if(!f)return;
    const values=f.getValues();
    const p=products.find(x=>x.id===values.product);
    const qty=Number(values.qty);
    if(!p)return toast('Pilih produk terlebih dahulu.','error');
    if(!Number.isInteger(qty)||qty<=0)return toast('Jumlah harus berupa bilangan bulat positif.','error');
    if(kind==='Keluar'&&qty>p.stock)return toast(`Stok tidak mencukupi. Tersedia ${fmt(p.stock)} unit.`,'error');
    const before=p.stock;
    p.stock+=(kind==='Masuk'?qty:-qty);
    const move={id:id(),time:localTime(),sort:Date.now(),kind,product:p.name,sku:p.sku,qty,before,after:p.stock,note:String(values.note||'').trim()||(kind==='Masuk'?'Penerimaan barang':'Distribusi toko'),staff:'Widhi'};
    moves.unshift(move);
    if(kind==='Masuk')daily.in+=qty;
    else daily.out+=qty;
    f.setValues({product:'',qty:'',note:''});
    refresh();
    toast(`Barang ${kind.toLowerCase()} berhasil dicatat.`);
  }
  function searchGrid(gridId,query){if($(gridId))$(gridId).filter(obj=>{const q=String(query||'').toLowerCase();return !q||Object.values(obj).some(v=>String(v).toLowerCase().includes(q))})}
  function resetDemo(){
    try{
      let handled=false;
      const onConfirm=res=>{
        if(res && !handled){
          handled=true;
          doReset();
        }
      };
      const p=webix.confirm({
        title:'Reset Data Demo?',
        text:'Semua perubahan produk dan mutasi lokal akan diganti kembali dengan data simulasi awal.',
        ok:'Reset Data',
        cancel:'Batal',
        type:'confirm-warning',
        callback:onConfirm
      });
      if(p&&typeof p.then==='function'){
        p.then(res=>{if(res!==false)onConfirm(true)}).catch(()=>{});
      }
    }catch(e){
      if(window.confirm('Reset data demo?\nSemua perubahan produk dan mutasi lokal akan diganti dengan data awal.')){
        doReset();
      }
    }
  }
  function doReset(){
    try{
      localStorage.removeItem(STORE.products);
      localStorage.removeItem(STORE.moves);
      localStorage.removeItem(STORE.daily);
      if($('productSearch'))$('productSearch').setValue('');
      if($('categoryFilter'))$('categoryFilter').setValue('Semua kategori');
      if($('productsGrid'))$('productsGrid').filter();
      if($('historySearch'))$('historySearch').setValue('');
      if($('historyFilter'))$('historyFilter').setValue('Semua jenis');
      if($('historyGrid'))$('historyGrid').filter();
      if($('inflowPageForm'))$('inflowPageForm').setValues({product:'',qty:'',note:''});
      if($('outflowPageForm'))$('outflowPageForm').setValues({product:'',qty:'',note:''});
      boot();
      refresh();
      toast('Data demo berhasil dipulihkan.');
    }catch(err){
      console.error('Reset error:',err);
      toast('Terjadi kesalahan saat mereset data.','error');
    }
  }
  function panelHead(title,sub,button,click){return `<div class="panel-heading"><div><h3>${title}</h3><p>${sub||''}</p></div>${button?`<button class="link-button" onclick="${click}">${button} →</button>`:''}</div>`}
  function columns(){
    const centered=text=>({text,css:'ow-center'}), center='ow-center';
    return{
      low:[
        {id:'no',header:centered('No'),width:48,css:center},
        {id:'name',header:'Nama Produk',fillspace:2,minWidth:140},
        {id:'sku',header:centered('SKU'),width:88,css:center,template:o=>`<span class="sku-pill">${esc(o.sku)}</span>`},
        {id:'stock',header:centered('Stok'),width:68,sort:'int',css:center,template:o=>`<strong>${fmt(o.stock)}</strong>`},
        {id:'min',header:centered('Batas Min'),width:92,css:center},
        {id:'location',header:centered('Lokasi'),width:78,css:center},
        {id:'status',header:centered('Status'),width:105,css:center,template:o=>badge(o.status)}
      ],
      latest:[
        {id:'time',header:centered('Waktu'),width:105,css:center,template:o=>`<span class="time-text">${esc(o.time)}</span>`},
        {id:'kind',header:centered('Jenis'),width:88,css:center,template:o=>kindBadge(o.kind)},
        {id:'product',header:'Produk',fillspace:2,minWidth:135},
        {id:'qty',header:centered('Jumlah'),width:78,css:center,template:o=>`<span class="${o.kind==='Masuk'?'qty-in':'qty-out'}">${o.kind==='Masuk'?'+':'−'}${fmt(o.qty)}</span>`},
        {id:'after',header:centered('Stok Akhir'),width:85,css:center,template:o=>`<strong>${fmt(o.after)}</strong>`},
        {id:'staff',header:centered('Petugas'),width:75,css:center}
      ],
      products:[
        {id:'sku',header:centered('SKU'),width:95,css:center,template:o=>`<span class="sku-pill">${esc(o.sku)}</span>`},
        {id:'name',header:'Nama Produk',fillspace:2,minWidth:160,sort:'string'},
        {id:'category',header:'Kategori',width:150},
        {id:'stock',header:centered('Stok'),width:78,sort:'int',css:center,template:o=>`<strong>${fmt(o.stock)}</strong>`},
        {id:'min',header:centered('Batas Min'),width:95,css:center},
        {id:'location',header:centered('Lokasi'),width:85,css:center},
        {id:'status',header:centered('Status'),width:115,css:center,template:o=>badge(o.status)},
        {id:'actions',header:centered('Aksi'),width:138,css:center,template:o=>`<button class="action-btn-edit" onclick="OptiWare.edit('${esc(o.id)}')">Edit</button><button class="action-btn-del" onclick="OptiWare.remove('${esc(o.id)}')">Hapus</button>`}
      ],
      history:[
        {id:'sort',header:centered('Waktu'),width:130,sort:'int',css:center,template:o=>`<span class="time-text">${esc(o.time)}</span>`},
        {id:'kind',header:centered('Jenis'),width:92,css:center,template:o=>kindBadge(o.kind)},
        {id:'product',header:'Nama Produk',width:175},
        {id:'sku',header:centered('SKU'),width:92,css:center,template:o=>`<span class="sku-pill">${esc(o.sku)}</span>`},
        {id:'qty',header:centered('Jumlah'),width:80,css:center,template:o=>`<span class="${o.kind==='Masuk'?'qty-in':'qty-out'}">${o.kind==='Masuk'?'+':'−'}${fmt(o.qty)}</span>`},
        {id:'before',header:centered('Stok Awal'),width:85,css:center},
        {id:'after',header:centered('Stok Akhir'),width:85,css:center,template:o=>`<strong>${fmt(o.after)}</strong>`},
        {id:'note',header:'Catatan',fillspace:2,minWidth:130},
        {id:'staff',header:centered('Petugas'),width:80,css:center}
      ],
      inflowHistory:[
        {id:'sort',header:centered('Waktu'),width:110,sort:'int',css:center,template:o=>`<span class="time-text">${esc(o.time)}</span>`},
        {id:'product',header:'Nama Produk',fillspace:2,minWidth:140},
        {id:'sku',header:centered('SKU'),width:88,css:center,template:o=>`<span class="sku-pill">${esc(o.sku)}</span>`},
        {id:'qty',header:centered('Jumlah'),width:80,css:center,template:o=>`<span class="qty-in">+${fmt(o.qty)}</span>`},
        {id:'after',header:centered('Stok Akhir'),width:85,css:center,template:o=>`<strong>${fmt(o.after)}</strong>`},
        {id:'note',header:'Catatan / Pemasok',fillspace:1,minWidth:120},
        {id:'staff',header:centered('Petugas'),width:75,css:center}
      ],
      outflowHistory:[
        {id:'sort',header:centered('Waktu'),width:110,sort:'int',css:center,template:o=>`<span class="time-text">${esc(o.time)}</span>`},
        {id:'product',header:'Nama Produk',fillspace:2,minWidth:140},
        {id:'sku',header:centered('SKU'),width:88,css:center,template:o=>`<span class="sku-pill">${esc(o.sku)}</span>`},
        {id:'qty',header:centered('Jumlah'),width:80,css:center,template:o=>`<span class="qty-out">−${fmt(o.qty)}</span>`},
        {id:'after',header:centered('Stok Akhir'),width:85,css:center,template:o=>`<strong>${fmt(o.after)}</strong>`},
        {id:'note',header:'Catatan / Tujuan',fillspace:1,minWidth:120},
        {id:'staff',header:centered('Petugas'),width:75,css:center}
      ]
    }
  }
  function app(){boot();const c=columns();webix.ui({container:'app',rows:[
    {view:'toolbar',css:'topbar',height:72,padding:{left:18,right:18},cols:[{view:'template',borderless:true,width:226,template:'<div class="brand"><div class="brand-mark">⌂</div><div><div class="brand-title"><span>Opti</span><span class="ware">Ware</span></div><div class="brand-sub">Warehouse Management</div></div></div>'},{view:'button',css:'mobile-menu',width:42,value:'☰',click:()=>document.querySelector('.nav-items').classList.toggle('open')},{view:'template',borderless:true,fillspace:true,template:'<div class="nav-items"><div class="nav-btn active" data-page="dashboard" onclick="OptiWare.go(\'dashboard\')"><span class="nav-icon">⌂</span>Dashboard</div><div class="nav-btn" data-page="products" onclick="OptiWare.go(\'products\')"><span class="nav-icon">▣</span>Produk &amp; Stok</div><div class="nav-btn" data-page="inflow" onclick="OptiWare.go(\'inflow\')"><span class="nav-icon">↓</span>Barang Masuk</div><div class="nav-btn" data-page="outflow" onclick="OptiWare.go(\'outflow\')"><span class="nav-icon">↑</span>Barang Keluar</div><div class="nav-btn" data-page="history" onclick="OptiWare.go(\'history\')"><span class="nav-icon">◷</span>Riwayat Mutasi</div></div>'},{view:'template',borderless:true,width:180,template:'<div class="userbox"><div class="avatar">W</div><div class="user-meta"><div class="user-name">Widhi</div><div class="user-role">Petugas Gudang</div></div></div>'}]},
    {view:'multiview',id:'views',animate:false,cells:[
      {id:'dashboard',view:'scrollview',scroll:'y',body:{padding:0,rows:[{template:'',borderless:true,height:1},{cols:[{view:'template',borderless:true,fillspace:true,template:'<div class="page-wrap"><div class="welcome"><div class="welcome-copy"><div class="welcome-eyebrow">Selamat datang,</div><h1>Petugas Gudang!</h1><p>Pantau pergerakan stok, barang masuk, dan barang keluar dengan mudah dan akurat.</p></div><div class="welcome-right"><div class="warehouse-art">🏭 📦</div><div class="date-card"><strong id="todayDate">Tanggal</strong><span id="todayClock">00:00:00</span></div></div></div><div class="section-gap"></div></div>'}],height:198},{view:'template',id:'dashboardContent',borderless:true,template:'',autoheight:true}]}} ,
      {id:'products',padding:24,rows:[{template:'<div class="section-title">Produk &amp; Stok</div><div class="section-sub">Kelola katalog produk, lokasi penyimpanan, dan kondisi persediaan.</div>',borderless:true,height:58},{css:'products-toolbar',cols:[{view:'text',id:'productSearch',placeholder:'Cari nama produk atau SKU...',width:260,css:'search-field',on:{onTimedKeyPress:function(){searchGrid('productsGrid',this.getValue())}}},{view:'select',id:'categoryFilter',width:190,value:'Semua kategori',options:['Semua kategori','Makanan','Minuman','Kebutuhan Rumah Tangga'],on:{onChange:v=>{if($('productsGrid'))$('productsGrid').filter(o=>v==='Semua kategori'||o.category===v)}}},{view:'button',value:'+ Tambah Produk',width:145,css:'btn-add-product',click:()=>productForm()},{view:'button',value:'Edit Terpilih',width:115,css:'btn-edit-product',click:()=>{const p=$('productsGrid').getSelectedItem();if(p)productForm(p);else toast('Pilih produk terlebih dahulu.','error')}},{view:'button',value:'Hapus',width:85,css:'btn-delete-product',click:deleteSelected},{view:'button',value:'↻ Reset Demo',width:120,css:'btn-reset-demo',click:resetDemo},{}],height:42,margin:8},{view:'datatable',id:'productsGrid',select:'row',resizeColumn:true,scrollX:true,rowHeight:44,headerRowHeight:44,columns:c.products,data:[],css:'panel',on:{onItemDblClick:x=>productForm($('productsGrid').getItem(x.row))}}]},
      {id:'inflow',padding:24,rows:[
        {template:'<div class="page-header-row"><div><div class="section-title">Barang Masuk (Inbound)</div><div class="section-sub">Catat penerimaan stok dari pemasok dan pantau riwayat barang masuk.</div></div><div class="inbound-kpi-badge"><span class="kpi-in-badge-icon">↓</span><div><strong id="inflowCount">0</strong><span>Unit Masuk Hari Ini</span></div></div></div>',borderless:true,height:60},
        {height:10},
        {cols:[
          {width:380,css:'form-panel-card',rows:[
            {template:'<div class="card-head-pill head-inflow"><span class="head-pill-icon">↓</span><span>Form Penerimaan Barang</span></div>',borderless:true,height:48},
            {view:'form',id:'inflowPageForm',padding:16,elements:[
              {view:'combo',id:'inflowProduct',name:'product',label:'Pilih Produk',labelPosition:'top',placeholder:'-- Cari produk dari katalog --',required:true,options:[]},
              {view:'text',id:'inflowQty',name:'qty',label:'Jumlah Masuk (Unit)',labelPosition:'top',type:'number',placeholder:'Contoh: 50',required:true},
              {view:'textarea',id:'inflowNote',name:'note',label:'Catatan / Nama Pemasok',labelPosition:'top',height:75,placeholder:'Contoh: Penerimaan dari Pemasok Utama'},
              {height:8},
              {view:'button',value:'＋ Simpan Barang Masuk',css:'btn-save-inflow',height:42,click:()=>saveQuickMove('Masuk')}
            ]}
          ]},
          {width:20},
          {css:'summary-card',rows:[
            {template:panelHead('Riwayat Penerimaan Masuk','Daftar transaksi barang masuk yang tercatat.',null),borderless:true,height:60},
            {view:'datatable',id:'inflowGrid',resizeColumn:true,scrollX:true,rowHeight:44,headerRowHeight:44,columns:c.inflowHistory,data:[],css:'summary-grid'}
          ]}
        ]}
      ]},
      {id:'outflow',padding:24,rows:[
        {template:'<div class="page-header-row"><div><div class="section-title">Barang Keluar (Outbound)</div><div class="section-sub">Catat pengeluaran dan distribusi stok barang ke toko atau pelanggan.</div></div><div class="outflow-kpi-badge"><span class="kpi-out-badge-icon">↑</span><div><strong id="outflowCount">0</strong><span>Unit Keluar Hari Ini</span></div></div></div>',borderless:true,height:60},
        {height:10},
        {cols:[
          {width:380,css:'form-panel-card',rows:[
            {template:'<div class="card-head-pill head-outflow"><span class="head-pill-icon">↑</span><span>Form Pengeluaran Barang</span></div>',borderless:true,height:48},
            {view:'form',id:'outflowPageForm',padding:16,elements:[
              {view:'combo',id:'outflowProduct',name:'product',label:'Pilih Produk',labelPosition:'top',placeholder:'-- Cari produk dari katalog --',required:true,options:[]},
              {view:'text',id:'outflowQty',name:'qty',label:'Jumlah Keluar (Unit)',labelPosition:'top',type:'number',placeholder:'Contoh: 20',required:true},
              {view:'textarea',id:'outflowNote',name:'note',label:'Catatan / Tujuan Toko',labelPosition:'top',height:75,placeholder:'Contoh: Distribusi Toko Alfamart 02'},
              {height:8},
              {view:'button',value:'＋ Simpan Barang Keluar',css:'btn-save-outflow',height:42,click:()=>saveQuickMove('Keluar')}
            ]}
          ]},
          {width:20},
          {css:'summary-card',rows:[
            {template:panelHead('Riwayat Pengeluaran Keluar','Daftar transaksi barang keluar yang tercatat.',null),borderless:true,height:60},
            {view:'datatable',id:'outflowGrid',resizeColumn:true,scrollX:true,rowHeight:44,headerRowHeight:44,columns:c.outflowHistory,data:[],css:'summary-grid'}
          ]}
        ]}
      ]},
      {id:'history',padding:24,rows:[{template:'<div class="section-title">Riwayat Mutasi</div><div class="section-sub">Seluruh pencatatan barang masuk dan keluar tersimpan secara lokal di browser ini.</div>',borderless:true,height:58},{css:'history-toolbar',cols:[{view:'text',id:'historySearch',placeholder:'Cari nama produk atau SKU...',width:260,css:'search-field',on:{onTimedKeyPress:function(){searchGrid('historyGrid',this.getValue())}}},{view:'select',id:'historyFilter',width:150,value:'Semua jenis',options:['Semua jenis','Masuk','Keluar'],on:{onChange:v=>{if($('historyGrid'))$('historyGrid').filter(o=>v==='Semua jenis'||o.kind===v)}}},{view:'button',value:'↻ Reset Demo',width:120,css:'btn-reset-demo',click:resetDemo},{}, {view:'template',borderless:true,width:300,template:'<div class="notice">Data disimpan di localStorage perangkat ini, bukan database server.</div>'}],height:42,margin:8},{view:'datatable',id:'historyGrid',resizeColumn:true,scrollX:true,rowHeight:44,headerRowHeight:44,columns:c.history,data:[],css:'panel'}]}
    ]}
  ]});buildDashboard(c);renderStats();renderBar();renderCondition();renderStock();renderMoves();renderProducts();renderHistory();renderInflow();renderOutflow();clock();setInterval(clock,1000)}
  function buildDashboard(c){const body=$('dashboardContent');body.setHTML(`<div class="page-wrap"><div class="section-title">Ringkasan Gudang</div><div class="section-sub">Data simulasi lokal untuk demonstrasi operasional.</div><div class="section-gap"></div><div class="dashboard-kpis"><div id="kpiHost1"></div><div id="kpiHost2"></div><div id="kpiHost3"></div><div id="kpiHost4"></div></div><div class="section-gap"></div><div class="dashboard-middle"></div><div class="section-gap"></div><div class="dashboard-tables"></div><div class="section-gap"></div><div class="safe-note">Demo frontend: data produk dan mutasi tersimpan pada localStorage browser ini, tanpa database server.</div></div>`);const root=body.getNode();const make=(host,config)=>webix.ui(webix.extend({container:host},config,true));make(root.querySelector('#kpiHost1'),{view:'template',id:'kpiProducts',borderless:true,height:126,template:''});make(root.querySelector('#kpiHost2'),{view:'template',id:'kpiUnits',borderless:true,height:126,template:''});make(root.querySelector('#kpiHost3'),{view:'template',id:'kpiIn',borderless:true,height:126,template:''});make(root.querySelector('#kpiHost4'),{view:'template',id:'kpiOut',borderless:true,height:126,template:''});const m=root.querySelector('.dashboard-middle'),t=root.querySelector('.dashboard-tables');make(m,{cols:[{rows:[{template:panelHead('Grafik Pergerakan Stok','Data simulasi demonstrasi untuk periode terpilih.',null),borderless:true,height:63},{cols:[{view:'template',borderless:true,fillspace:true,template:'<div class="chart-legend"><span class="legend-key"><i class="legend-swatch" style="background:#FF7618"></i>Barang Masuk</span><span class="legend-key"><i class="legend-swatch" style="background:#123653"></i>Barang Keluar</span></div>'},{view:'select',id:'periodSelect',width:148,value:'7',options:[{id:'7',value:'7 Hari Terakhir'},{id:'30',value:'30 Hari Terakhir'},{id:'month',value:'Bulan Ini'}],on:{onChange:v=>{period=v;renderBar()}}}],height:35},{view:'chart',id:'movementChart',type:'bar',value:'#masuk#',color:'#FF7618',barWidth:14,tooltip:{template:'#masuk#'},xAxis:{template:'#day#',lines:false},yAxis:{start:0,end:40,step:10},legend:false,series:[{value:'#masuk#',color:'#FF7618',tooltip:{template:'Masuk: #masuk#'}},{value:'#keluar#',color:'#123653',tooltip:{template:'Keluar: #keluar#'}}],data:[],css:'chart-wrap'}]},{width:20},{rows:[{template:panelHead('Kondisi Stok Produk','Sebaran kondisi seluruh produk.',null),borderless:true,height:63},{cols:[{view:'chart',id:'conditionChart',type:'donut',value:'#value#',color:function(obj){return obj.color},label:'',innerRadius:62,donutInnerText:'124 Produk',tooltip:{template:'#label#: #value#'},data:[],css:'status-chart'},{view:'template',id:'conditionLegend',borderless:true,fillspace:true,template:''}],height:218}],width:390}]});make(t,{cols:[{css:'summary-card',rows:[{template:panelHead('Produk Stok Menipis','Produk pada atau di bawah batas minimum.','Lihat Semua','OptiWare.go(\'products\')'),borderless:true,height:64},{view:'datatable',id:'lowGrid',height:280,rowHeight:44,headerRowHeight:44,scrollX:window.innerWidth<1100,columns:c.low,data:[],css:'summary-grid'}]},{width:20},{css:'summary-card',rows:[{template:panelHead('Aktivitas Gudang Terbaru','Mutasi yang paling baru dicatat.','Lihat Semua','OptiWare.go(\'history\')'),borderless:true,height:64},{view:'datatable',id:'latestGrid',height:280,rowHeight:44,headerRowHeight:44,scrollX:window.innerWidth<1100,columns:c.latest,data:[],css:'summary-grid'}]}]})}
  function clock(){const d=new Date();const date=document.getElementById('todayDate'),time=document.getElementById('todayClock');if(date)date.textContent=d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});if(time)time.textContent=d.toLocaleTimeString('id-ID')}
  window.OptiWare={
    go:setPage,
    move:kind=>setPage(kind==='Masuk'?'inflow':'outflow'),
    modal:movementForm,
    edit:productId=>{const p=products.find(x=>x.id===productId);if(p)productForm(p)},
    remove:productId=>{const p=products.find(x=>x.id===productId);if(!p)return;webix.confirm({title:'Hapus produk?',text:`Produk ${esc(p.name)} akan dihapus. Riwayat mutasi tetap tersimpan.`,ok:'Hapus',cancel:'Batal'}).then(()=>{products=products.filter(x=>x.id!==productId);refresh();toast('Produk dihapus.')}).catch(()=>{})},
    reset:resetDemo,
    resetDemo:resetDemo
  };
  if(window.webix)webix.ready(app);else document.addEventListener('DOMContentLoaded',()=>{if(window.webix)webix.ready(app);else document.getElementById('app').textContent='Webix gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.'});
})();
