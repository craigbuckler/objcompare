import { load } from 'js-yaml';
import diff from 'microdiff';

// dom elements
const dom = {
  dataold,
  datanew,
  result: '#diff tbody',
  nochange
};

// sort values
const typeOrder = {
  remove: 0,
  change: 1,
  create: 2
};

for (let d in dom) {
  if (typeof dom[d] === 'string') {
    dom[d] =  document.querySelector(dom[d]);
  }
}

// restore session value
const
  vOld = sessionStorage.getItem(dom.dataold.id),
  vNew = sessionStorage.getItem(dom.datanew.id);

if (vOld) dom.dataold.value = vOld;
if (vNew) dom.datanew.value = vNew;

let dOld, dNew;
dom.dataold.addEventListener('input', getDiff);
dom.datanew.addEventListener('input', getDiff);

getDiff();


// generate differences
function getDiff(e) {

  showResult();

  if (!dOld || e.target === dom.dataold) dOld = toObject(dom.dataold);
  if (!dNew || e.target === dom.datanew) dNew = toObject(dom.datanew);

  if (dOld && dNew) {

    showResult(

      diff(dOld, dNew)
        .map(d => {

          let
            dOld = d.oldValue && getDef(d.oldValue),
            dNew = d.value && getDef(d.value);

          return {

            type: d.type.toLowerCase(),
            msg: [
              d.type, d.path.join(' . '),
              (dOld ? `${ dOld.str } (${ dOld.type })` : '') +
                (d.type === 'CHANGE' ? ' 🡆 ' : '') +
                (dNew ? `${ dNew.str } (${ dNew.type })` : '')
            ]

          };
        })
        .sort((a, b) => (
          ( typeOrder[a.type] - typeOrder[b.type] ) ||
          ( a.msg[1] === b.msg[1] ? 0 : a.msg[1] > b.msg[1] ? 1 : -1 )
        ))

    );

  }

}


// convert a JSON or YAML in an element value to a JavaScript object
function toObject(element) {

  const
    str = element.value,
    eClass = 'error';

  let obj, err;

  // convert from JSON
  try {
    obj = JSON.parse(str);
  }
  catch(e) {
    err = e.message;
  }

  // convert from YAML
  try {
    obj = obj || load(str);
    err = null;
  }
  catch(e) {
    obj = null;
    err = err || 'Invalid YAML';
  }

  if (obj) {
    element.classList.remove(eClass);
  }
  else {
    element.classList.add(eClass);
  }

  if (err) {

    // show errors
    showResult([
      {
        type: 'error',
        msg: ['ERROR', element.dataset.name || '', err]
      }
    ]);
  }
  else {

    // store session value
    if (str && element.id) sessionStorage.setItem(element.id, str);

  }

  return obj;

}


// show results table
function showResult(data) {

  // clear results
  if (!data || !data.length) {

    while (dom.result.lastChild) dom.result.removeChild(dom.result.lastChild);
    dom.nochange.removeAttribute('hidden');

    return;
  }

  // hide "no change"
  dom.nochange.setAttribute('hidden', 'hidden');

  // create table
  const frag = document.createDocumentFragment();

  data.forEach(out => {

    const tr = document.createElement('tr');
    if (out.type) tr.className = out.type;
    out.msg.forEach(m => {
      const td = document.createElement('td');
      td.textContent = m;
      tr.appendChild(td);
    });

    frag.appendChild(tr);

  });

  dom.result.appendChild(frag);

}


// get object string and type
function getDef(val) {

  let
    str = val && String(val),
    type = val && typeof val;

  if (type === 'string') {
    str = `"${ str }"`;
  }

  if (type === 'object' && Array.isArray(val)) {
    type = 'array';
    str = `[${ str }]`;
  }

  if (str.includes('object')) {
    str = type === 'array' ? '[...]' : '{...}';
  }

  return { str, type };

}
