var viewer = new Cesium.Viewer('cesiumContainer');

function readFile(evt)
{
    var file = evt.target.files[0];
    
    if(file)
    {
        var r = new FileReader();
        r.onload = function(e) {
            var contents = r.result;
            readData(contents);
        };
        r.readAsArrayBuffer(file);
    }
}

document.getElementById('gmlzFile').addEventListener('change', readFile, false);

var uxCoord = {}, uyCoord = {};
var nodes = [];
var byteCount = 0;

function GMLNode()
{
        this.inIndex = [];
        this.exIndex = [];
        this.properties = {};
}


function readData(bs)
{
        uxCoord = {}, uyCoord = {};
        nodes = [];
        byteCount = 0;

	bs = new DataView(bs, 0);
	uxCoord = loadCoordinates(bs);
	uyCoord = loadCoordinates(bs);
    loadNodes(bs);
	drawLayer();
}

function loadCoordinates(bs)
{
    var i, j, k;
    var coord = {};
    var numString=[];
    var curr = [];

    var coordCount = bs.getUint32(byteCount);
    byteCount += 4;
    for(i=0; i<coordCount; i++)
    {
        var coordLen = bs.getUint8(byteCount);
        byteCount++;
        
        var ind = bs.getUint8(byteCount);
        byteCount++;
        
        var c = "";

        for(j=ind; j<coordLen; j++)
        {
            curr[j] = bs.getUint8(byteCount);
            byteCount++;
        }
        for(j=0; j<coordLen; j++)
        {
            if(curr[j] == 10)
            {
                    c += '.';
                    continue;
            }
            c += curr[j];
        }
        //console.log(c);
        coord[c] = [];

        var indLen = bs.getUint8(byteCount);
        byteCount++;
        for(j=0; j<indLen; j++)
        {
            var len = bs.getUint8(byteCount);
            byteCount++;
            var factor = 1, currInd = 0;
            for(k=0; k<len; k++)
            {
                currInd += bs.getUint8(byteCount)*factor;
                byteCount++;
                factor *= 256;
            }
            coord[c].push(currInd);
        }
    }
    return coord;
}

function loadNodes(bs)
{
    var i, j, k, start, end;
    var nodeCount = bs.getUint32(byteCount);
    byteCount += 4;
    for(i=0; i<nodeCount; i++)
    {
        var node = new GMLNode();

        var exCount = bs.getUint8(byteCount);
        byteCount++;
        for(j=0; j<exCount; j++)
        {
            start = bs.getUint32(byteCount);
            byteCount += 4;
            end = bs.getUint32(byteCount);
            byteCount += 4;
            node.exIndex.push([start, end]);
        }

        var iniCount = bs.getUint8(byteCount);
        byteCount++;
        for(j=0; j<iniCount; j++)
        {
            start = bs.getUint32(byteCount);
            byteCount += 4;
            end = bs.getUint32(byteCount);
            byteCount += 4;
            node.inIndex.push([start, end]);
        }

        var propCount = bs.getUint8(byteCount);
        byteCount++;
        for(j=0; j<propCount; j++)
        {
                var str = "", value = "", key = "";
                while(1)
                {
                        var c = String.fromCharCode(bs.getUint8(byteCount));
                        byteCount++;
                        if(c == '\n')
                        {
                                value = str;
                                break;
                        }
                        else if(c == ':')
                        {
                                key = str;
                                str = "";
                        }
                        else
                        {
                                str += c;
                        }
                }
                node.properties[key] = value;
        }
        nodes.push(node);
    }
}

var xList = [], yList = [];
function drawLayer()
{
    var i, j, k, poly;
    
    var keys = [];
    keys = Object.keys(uxCoord);
    for(i=0; i<keys.length; i++)
    {
        for(j=0; j<uxCoord[keys[i]].length; j++)
        {
            xList[uxCoord[keys[i]][j]] = keys[i];
        }
    }
    
    keys = Object.keys(uyCoord);
    for(i=0; i<keys.length; i++)
    {
        for(j=0; j<uyCoord[keys[i]].length; j++)
        {
            yList[uyCoord[keys[i]][j]] = keys[i];
        }
    }
    
    for(i=0; i<nodes.length; i++)
    {
        var start, end;
        for(j=0; j<nodes[i].exIndex.length; j++)
        {
            var cArray = [];
            start = nodes[i].exIndex[j][0];
            end = nodes[i].exIndex[j][1];
            for(k=start; k<end; k++)
            {
                cArray.push(xList[k]);
                cArray.push(yList[k]);
            }
            poly = viewer.entities.add({
                name : '',
                polygon : {
                    hierarchy : Cesium.Cartesian3.fromDegreesArray(cArray),
                    material : Cesium.Color.RED.withAlpha(0.5),
                    outline : true,
                    outlineColor : Cesium.Color.BLACK
                }
            });
            
        }
        /*for(j=0; j<nodes[i].inIndex.length; j++)
        {
            start = nodes[i].inIndex[j][0];
            end = nodes[i].inIndex[j][1];
            for(k=start; k<end; k++)
            {
                cArray.push(xList[k]);
                cArray.push(yList[k]);
            }*/
    }
    viewer.zoomTo(poly);
}//Sandcastle_End

