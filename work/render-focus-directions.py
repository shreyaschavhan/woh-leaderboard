"""Draw static UI concepts for native image-viewer review. No browser required."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'work' / 'focus-directions.png'
SCALE = 2
W, H = 1440, 1100
im = Image.new('RGB', (W * SCALE, H * SCALE), '#e9e4e8')
draw = ImageDraw.Draw(im)
colors = dict(bg='#eee8e7', paper='#fbf6ee', soft='#e8dfe6', line='#d7cbd5',
              ink='#302638', muted='#746479', accent='#725080', button='#4c365a',
              green='#37704f')
font_root = Path('C:/Windows/Fonts')
fonts = {}


def font(size, bold=False):
    key = (size, bold)
    if key not in fonts:
        fonts[key] = ImageFont.truetype(str(font_root / ('segoeuib.ttf' if bold else 'segoeui.ttf')), round(size * SCALE))
    return fonts[key]


def text(x, y, value, size=14, fill=None, bold=False, anchor='la'):
    draw.text((round(x * SCALE), round(y * SCALE)), str(value), font=font(size, bold),
              fill=fill or colors['ink'], anchor=anchor)


def rect(x, y, w, h, fill, radius=0, outline=None):
    box = tuple(round(v * SCALE) for v in (x, y, x+w, y+h))
    if radius:
        draw.rounded_rectangle(box, radius=round(radius*SCALE), fill=fill, outline=outline, width=SCALE)
    else:
        draw.rectangle(box, fill=fill, outline=outline, width=SCALE)


def line(x, y, x2, y2, fill=None):
    draw.line((round(x*SCALE), round(y*SCALE), round(x2*SCALE), round(y2*SCALE)), fill=fill or colors['line'], width=SCALE)


def ellipse(x, y, w, h, fill):
    draw.ellipse(tuple(round(v*SCALE) for v in (x,y,x+w,y+h)), fill=fill)


def polygon(points, fill):
    draw.polygon([(round(x*SCALE),round(y*SCALE)) for x,y in points], fill=fill)


def sprite(source, x, y, size):
    # Native project textures are drawn intact, as they are in the UI.
    original = Image.open(ROOT/source).convert('RGBA')
    texture = original.resize((round(size*SCALE), round(size*SCALE)), Image.Resampling.NEAREST)
    im.paste(texture, (round(x*SCALE),round(y*SCALE)), texture)


def button(x, y, width, label, dark=True):
    rect(x,y,width,36,colors['button'] if dark else '#ead9ad',4)
    fg = '#fffaf2' if dark else '#35273c'
    text(x+width/2-7,y+8,label,13,fg,True,'ma')
    line(x+width-24,y+22,x+width-16,y+14,fg)
    line(x+width-22,y+14,x+width-16,y+14,fg)
    line(x+width-16,y+14,x+width-16,y+20,fg)


def dot(x, y, fill=None):
    ellipse(x,y,6,6,fill or colors['green'])


markup = (ROOT/'design/focus-balance-study/index.html').read_text(encoding='utf-8')
trainers = json.loads(re.search(r'<script[^>]+id="trainer-data"[^>]*>(.*?)</script>',markup,re.S).group(1))[:4]
minutes = [42,87,126,30]
flowers = [168,147,138]
gains = ['+24','+27','-6']


def portrait(trainer, x, y, size=40):
    rect(x,y,size,size,colors['soft'],5)
    sprite(trainer['avatar'],x,y,size)


def hero(x, y, w):
    # Condensed page context; these are design concepts, not browser screenshots.
    rect(x,y,w,202,'#44465a')
    polygon([(x,y+170),(x+180,y+90),(x+320,y+128),(x+450,y+54),(x+w,y+135),(x+w,y+202),(x,y+202)],'#5f7167')
    polygon([(x,y+184),(x+130,y+160),(x+265,y+178),(x+440,y+134),(x+w,y+166),(x+w,y+202),(x,y+202)],'#41544e')
    ellipse(x+w-43,y+18,18,18,'#e8ce92')
    text(x+23,y+16,'Warriors of Hell',12,'#fffaf2',True)
    text(x+23,y+79,'Consistency',25,'#fffaf2',True)
    text(x+23,y+109,'Leaderboard',25,'#fffaf2',True)
    text(x+23,y+151,'31 trainers  ·  817 flowers',12,'#e4dae6')
    for index, dx, top, tint in [(1,0,142,'#bdc5db'),(0,117,125,'#e8be59'),(2,234,153,'#cd9978')]:
        bx=x+w-360+dx
        trainer=trainers[index]
        sprite(trainer['avatar'],bx+3,y+top-79,85)
        sprite(trainer['focumon'],bx+50,y+top-64,67)
        rect(bx,y+top,112,202-top,tint,0,'#302638')
        text(bx+56,y+top+8,trainer['name'],12,'#302638',True,'ma')
        text(bx+56,y+top+27,flowers[index],16,'#302638',True,'ma')


def heading(x, y, w, label, personal=False):
    text(x,y,label,19,bold=True)
    if personal:
        text(x+w-17,y+4,'Apoorv',13,colors['muted'],anchor='ra')
        line(x+w-9,y+12,x+w-5,y+16,colors['muted'])
        line(x+w-5,y+16,x+w-1,y+12,colors['muted'])
    else:
        dot(x+w-48,y+10)
        text(x+w,y+4,'3 live',12,colors['muted'],anchor='ra')


def standings(x, y, w):
    line(x,y,x+w,y)
    text(x,y+20,'Full standings',21,bold=True)
    text(x+w,y+25,'This week',12,colors['muted'],anchor='ra')
    rect(x,y+56,w,30,colors['soft'])
    text(x+14,y+62,'#',12,colors['muted'])
    text(x+53,y+62,'Trainer',12,colors['muted'])
    text(x+w-133,y+62,'Flowers',12,colors['muted'])
    text(x+w-16,y+62,'Gain',12,colors['muted'],anchor='ra')
    for i, trainer in enumerate(trainers[:3]):
        row=y+86+i*47
        rect(x,row,w,47,colors['paper'])
        line(x,row+47,x+w,row+47)
        text(x+18,row+13,i+1,13,colors['muted'])
        portrait(trainer,x+50,row+7,31)
        text(x+91,row+13,trainer['name'],13,bold=True)
        text(x+w-133,row+11,flowers[i],17,bold=True)
        text(x+w-16,row+14,gains[i],13,colors['green'] if i<2 else '#a85469',anchor='ra')


def compact(x,y,w):
    heading(x,y,w,'Your session',True)
    top=y+38
    rect(x,top,w,151,colors['paper'],6,colors['line'])
    portrait(trainers[0],x+18,top+20,49)
    dot(x+83,top+23)
    text(x+96,top+17,'Focusing',12,colors['green'])
    text(x+83,top+40,'Build something that matters',17,bold=True)
    text(x+w-23,top+11,'42',42,anchor='ra')
    text(x+w-21,top+62,'min focused',12,colors['muted'],anchor='ra')
    line(x+18,top+90,x+w-18,top+90)
    text(x+20,top+111,'Finish session',13,colors['muted'])
    button(x+w-177,top+104,159,'Open Focumon')
    live=top+179
    heading(x,live,w,'Focusing now')
    line(x,live+36,x+w,live+36)
    for i,trainer in enumerate(trainers):
        row=live+37+i*55
        portrait(trainer,x+1,row+8,38)
        text(x+52,row+7,trainer['name'],14,bold=True)
        if i==0:text(x+111,row+9,'you',11,colors['muted'])
        text(x+52,row+29,'On a break' if i==3 else 'Focusing',11,colors['muted'])
        text(x+w-60,row+10,minutes[i],23,anchor='ra')
        text(x+w-49,row+22,'min',11,colors['muted'])
        text(x+w-5,row+16,'›',18,colors['muted'],anchor='ra')
        line(x,row+54,x+w,row+54)
    foot=live+268
    text(x,foot,'4 sessions in your guild',11,colors['muted'])
    text(x+w,foot,'Just updated',11,colors['muted'],anchor='ra')


def illustrated(x,y,w):
    heading(x,y,w,'Your training',True)
    top=y+38
    rect(x,top,w,216,'#342d40',6)
    ellipse(x+w-63,top+20,25,25,'#d3bf9f')
    polygon([(x+w-292,top+161),(x+w-250,top+116),(x+w-186,top+55),(x+w-145,top+94),(x+w-101,top+62),(x+w-38,top+115),(x+w,top+81),(x+w,top+165)],'#625060')
    polygon([(x+w-320,top+166),(x+w-234,top+126),(x+w-183,top+142),(x+w-122,top+97),(x+w-40,top+146),(x+w,top+109),(x+w,top+166)],'#2e2b38')
    polygon([(x+w-239,top+136),(x+w-50,top+129),(x+w-20,top+143),(x+w-66,top+155),(x+w-246,top+149)],'#817268')
    sprite(trainers[0]['avatar'],x+w-253,top+21,137)
    sprite(trainers[0]['focumon'],x+w-141,top+47,111)
    dot(x+22,top+25,'#b7d8b9')
    text(x+35,top+19,'Focusing',12,'#b7d8b9')
    text(x+21,top+43,'42',47,'#f0dba6')
    text(x+86,top+79,'min focused',12,'#d4c5d5')
    text(x+23,top+116,'Build something that matters',15,'#f4e9e9')
    rect(x+1,top+165,w-2,49,'#2c2536')
    line(x,top+165,x+w,top+165,'#534455')
    button(x+18,top+172,159,'Open Focumon',False)
    text(x+w-21,top+181,'Finish session',13,'#d3c1d5',anchor='ra')
    live=top+244
    heading(x,live,w,'Focusing now')
    cw=(w-20)/3
    for i,trainer in enumerate(trainers[:3]):
        left=x+i*(cw+10)
        rect(left,live+38,cw,127,colors['paper'],5,colors['line'])
        ellipse(left+25,live+98,cw-50,9,colors['soft'])
        sprite(trainer['avatar'],left+cw/2-60,live+35,72)
        sprite(trainer['focumon'],left+cw/2-5,live+48,58)
        text(left+cw/2,live+111,trainer['name'],13,bold=True,anchor='ma')
        text(left+cw/2-4,live+132,minutes[i],22,anchor='ra')
        text(left+cw/2+2,live+143,'min',11,colors['muted'])
    row=live+176
    portrait(trainers[3],x+8,row,31)
    text(x+49,row-1,'SShbounty',12,bold=True)
    text(x+49,row+16,'On a break',11,colors['muted'])
    text(x+w-39,row+2,'30',19,colors['muted'],anchor='ra')
    text(x+w-32,row+11,'min',11,colors['muted'])
    text(x,live+224,'4 sessions in your guild',11,colors['muted'])
    text(x+w,live+224,'Just updated',11,colors['muted'],anchor='ra')


for index,(title,renderer) in enumerate([('A  ·  Compact dashboard',compact),('B  ·  Small illustrated card',illustrated)]):
    x=26+index*707
    text(x,17,title,23,bold=True)
    rect(x,60,680,1007,colors['bg'],7,colors['line'])
    hero(x+1,61,678)
    renderer(x+25,282,630)
    standings(x+25,817,630)

text(W/2,1079,'STATIC DESIGN CONCEPTS  ·  SAME SAMPLE SESSIONS',11,colors['muted'],anchor='ma')
im.save(OUT)
print(OUT)
