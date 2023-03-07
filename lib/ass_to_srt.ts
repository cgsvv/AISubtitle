const re_ass = new RegExp('Dialogue:\\s\\d,' + // get time and subtitle
        '(\\d+:\\d\\d:\\d\\d.\\d\\d),' +     // start time
        '(\\d+:\\d\\d:\\d\\d.\\d\\d),' +     // end time
        '([^,]*),' +                  // object
        '([^,]*),' +                  // actor
        '(?:[^,]*,){4}' +
        '(.*)$', 'i');                // subtitle
const re_newline = /\\n/ig // replace \N with newline
const re_style = /\{[^}]+\}/g // replace style

export function ass_to_srt(assText: string) {
  var srts: any[] = [];
  String(assText).split(/\r*\n/).forEach(function(line) {
    var m = line.match(re_ass);
    if(!m) {console.log(line); return;}

    var start = m[1], end = m[2], what = m[3], actor = m[4], text = m[5];
    text = text.replace(re_style, '').replace(re_newline, '\r\n');
    srts.push({start: start, end: end, text: text});
  });

  var i = 1;
  var output = srts.sort(function(d1, d2) {
    var s1 = assTime2Int(d1.start);
    var s2 = assTime2Int(d2.start);
    var e1 = assTime2Int(d1.end);
    var e2 = assTime2Int(d2.end);

    return s1 != s2 ? s1 - s2 : e1 - e2;
  }).map(function(srt) {
    var start = assTime2SrtTime(srt.start);
    var end = assTime2SrtTime(srt.end);
    return (i++) + '\n'
      + start + ' --> ' + end + '\n'
      + srt.text + '\n\n';
  }).join('');

  return output;
};

function assTime2Int(assTime: string) {
  return parseInt(assTime.replace(/[^0-9]/g, ''));
}

function assTime2SrtTime(assTime: string) {
  var h = '00', ms = '000';
  var m = h; var s = h;
  var t = assTime.split(':');
  if(t.length > 0) h = t[0].length == 1 ? '0'+t[0] : t[0];
  if(t.length > 1) m = t[1].length == 1 ? '0'+t[1] : t[1];
  if(t.length > 2) {
    var t2 = t[2].split('.');
    if(t2.length > 0) s = t2[0].length == 1 ? '0'+t2[0] : t2[0];
    if(t2.length > 0) ms = t2[1].length == 2 ? '0'+t2[1] : t2[1].length == 1 ? '00'+ t2[1] : t2[1];
  }
  return [h, m , s+','+ms].join(':');
}