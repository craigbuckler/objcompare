import { load } from 'js-yaml';
import diff from 'microdiff';

// dom elements
const dom = {
  dataold,
  datanew,
  result: '#diff tbody',
  nochange
};

for (let d in dom) {
  if (typeof dom[d] === 'string') {
    dom[d] =  document.querySelector(dom[d]);
  }
}

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

      diff(dOld, dNew).map(d => ({

        type: d.type.toLowerCase(),
        msg: [d.type, d.path.join(' . '),
          (d.oldValue ? d.oldValue + ' (' + typeof d.oldValue + ')' : '') +
          (d.type === 'CHANGE' ? ' 🡆 ' : '') +
          (d.value ? d.value + ' (' + typeof d.value + ')' : '')
        ]

      }))

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

  // show errors
  if (err) {
    showResult([
      {
        type: 'error',
        msg: ['ERROR', element.dataset.name || '', err]
      }
    ]);
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
