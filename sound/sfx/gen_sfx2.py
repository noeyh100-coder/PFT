import numpy as np, sys, wave
from scipy.signal import fftconvolve, butter, lfilter
SR=44100
OUT=sys.argv[1]
rng=np.random.default_rng(11)
def T(d): return np.arange(int(SR*d))/SR
def env(n,a,dec,curve=6.0):
    t=np.arange(n)/SR
    return np.minimum(1,t/max(a,1e-4))*np.exp(-np.maximum(0,t-a)*curve/max(dec,1e-4))
def lp(x,f): b,a=butter(2,min(f,SR/2-100)/(SR/2),'low'); return lfilter(b,a,x)
def hp(x,f): b,a=butter(2,f/(SR/2),'high'); return lfilter(b,a,x)
def bp(x,lo,hi): return lp(hp(x,lo),hi)
def noise(d): return rng.standard_normal(int(SR*d))
def sine(f,d,ph=0):
    t=T(d)
    if callable(f): return np.sin(2*np.pi*np.cumsum(f(t))/SR)
    return np.sin(2*np.pi*f*t)
def bell(f,d,bright=0.3,dec=None):
    t=T(d); dec=dec or d
    s=np.sin(2*np.pi*f*t)+bright*np.sin(2*np.pi*f*2.0*t)*np.exp(-t*6)+0.15*bright*np.sin(2*np.pi*f*3.01*t)*np.exp(-t*10)
    return s*env(len(t),0.003,dec,5)
def metal(f,d):
    t=T(d); s=sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-t*k) for r,a,k in [(1,1,6),(2.76,0.6,9),(5.40,0.35,13),(8.93,0.2,18)])
    return s*np.minimum(1,t/0.002)
def place(buf,x,at):
    i=int(at*SR); need=i+len(x)
    if need>len(buf): buf=np.concatenate([buf,np.zeros(need-len(buf))])
    buf[i:i+len(x)]+=x; return buf
def thud(f0=120,d=0.25,drop=8):
    t=T(d); f=f0*np.exp(-t*drop)+40; return np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(t),0.002,d*0.7,6)
def whoosh(d,lo,hi,up=True):
    n=noise(d); t=T(d); c=np.linspace(0,1,len(t))
    out=np.zeros(len(n)); seg=2048
    for i in range(0,len(n),seg):
        k=c[i] if up else 1-c[i]
        f1=lo+(hi-lo)*k
        out[i:i+seg]=bp(n[i:i+seg+0][:seg],max(60,f1*0.6),f1*1.4)[:len(out[i:i+seg])]
    return out*np.sin(np.linspace(0,np.pi,len(n)))**1.5
def crackle(d,rate=60,f=3000):
    n=np.zeros(int(SR*d))
    for _ in range(int(rate*d)):
        i=rng.integers(0,len(n)-200); n[i:i+200]+=rng.standard_normal(200)*np.exp(-np.arange(200)/30)
    return hp(n,f*0.3)
def reverb(x,rt=0.5,mix=0.18):
    n=int(SR*rt); ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*6.9/rt); ir=lp(ir,6000); ir/=np.sqrt(np.sum(ir**2))
    w=fftconvolve(x,ir); w=np.concatenate([w,np.zeros(max(0,len(x)+n-len(w)))])[:len(x)+n]
    return np.concatenate([x,np.zeros(n)])*(1-mix)+w*mix*0.6
def fin(x,name,rt=0.45,mix=0.18):
    x=reverb(x,rt,mix); nz=np.nonzero(np.abs(x)>1e-4*np.max(np.abs(x)))[0]; x=x[:nz[-1]+1]
    f=min(len(x),int(0.02*SR)); x[-f:]*=np.linspace(1,0,f); x=x/np.max(np.abs(x))*0.9
    with wave.open(OUT+'/'+name+'.wav','wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype('<i2').tobytes())
N=lambda m:440*2**((m-69)/12)

# loot
b=np.zeros(1); b=place(b,thud(400,0.08,20)*0.4,0); b=place(b,bell(N(84),0.3,0.2)*0.6,0.02); fin(b,'loot1',0.3,0.12)
b=np.zeros(1); b=place(b,thud(500,0.08,20)*0.35,0)
for k,m in enumerate([86,91]): b=place(b,bell(N(m),0.35,0.25)*0.55,0.02+k*0.06)
fin(b,'loot2',0.35,0.15)
b=np.zeros(1); b=place(b,thud(500,0.08,20)*0.3,0)
for k,m in enumerate([84,88,91,96]): b=place(b,bell(N(m),0.5,0.25)*0.5,0.02+k*0.055)
for k in range(8): b=place(b,bell(N(96+rng.integers(0,8)),0.12,0.05)*0.15,0.2+k*0.03)
fin(b,'loot3',0.6,0.22)
b=np.zeros(1); b=place(b,thud(450,0.1,18)*0.35,0)
for k,m in enumerate([81,88]): b=place(b,bell(N(m),0.4,0.3)*0.55,0.03+k*0.07)
fin(b,'loot-item',0.4,0.15)
b=np.zeros(1); t=T(0.5); sw=sine(lambda t: 500*(1+3*t/0.5),0.5)*np.sin(np.linspace(0,np.pi,len(t)))*0.3; b=place(b,sw,0)
for k,m in enumerate([79,84,88,91,96]): b=place(b,bell(N(m),0.6,0.25)*0.45,0.25+k*0.05)
fin(b,'loot-gim',0.8,0.25)

# type skill sounds
def snd_type(ty):
    b=np.zeros(1)
    if ty=='노말':
        b=place(b,whoosh(0.2,600,2500)*0.5,0); b=place(b,thud(220,0.12,14)*0.6,0.12)
    elif ty=='불꽃':
        n=lp(noise(0.45),2500)*env(int(SR*0.45),0.03,0.35,4)*0.6; b=place(b,n,0); b=place(b,crackle(0.4,70)*0.5,0.03); b=place(b,thud(90,0.3,4)*0.5,0)
    elif ty=='물':
        for k in range(5):
            f0=500+k*140; d=0.07; bl=sine(lambda t,f0=f0: f0*(1+2.5*t/0.07),d)*env(int(SR*d),0.003,0.05,5)
            b=place(b,bl*0.5,k*0.045)
        b=place(b,bp(noise(0.3),800,4000)*env(int(SR*0.3),0.01,0.2,5)*0.25,0)
    elif ty=='풀':
        n=bp(noise(0.35),1500,6000)*(0.6+0.4*np.sin(2*np.pi*22*T(0.35)))*env(int(SR*0.35),0.02,0.3,4)*0.4; b=place(b,n,0)
        b=place(b,bell(N(81),0.25,0.1)*0.4,0.05); b=place(b,bell(N(88),0.25,0.1)*0.3,0.12)
    elif ty=='전기':
        t=T(0.35); f=1400*np.exp(-t*6)+200; s=np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*0.3+np.sin(2*np.pi*np.cumsum(f)/SR)*0.5
        s*= (0.6+0.4*np.sign(np.sin(2*np.pi*45*t)))*env(len(t),0.003,0.3,5); b=place(b,lp(s,5000)*0.6,0); b=place(b,crackle(0.3,90,4000)*0.5,0)
    elif ty=='얼음':
        for k,f in enumerate([2600,3480,4150,3100]): b=place(b,bell(f,0.35,0.05)*0.35,k*0.035)
        b=place(b,hp(noise(0.3),5000)*env(int(SR*0.3),0.01,0.25,5)*0.3,0)
    elif ty=='격투':
        b=place(b,thud(140,0.2,12),0); b=place(b,hp(noise(0.05),1500)*env(int(SR*0.05),0.001,0.04,5)*0.6,0)
    elif ty=='독':
        for k in range(4):
            d=0.12; f0=180+k*60; bl=sine(lambda t,f0=f0: f0*(1+1.5*np.sin(2*np.pi*12*t)),d)*env(int(SR*d),0.01,0.1,4); b=place(b,lp(bl,1200)*0.6,k*0.07)
    elif ty=='땅':
        b=place(b,lp(noise(0.45),400)*env(int(SR*0.45),0.02,0.4,3)*0.9,0); b=place(b,thud(70,0.35,3)*0.8,0)
    elif ty=='비행':
        b=place(b,whoosh(0.35,500,3000)*0.8,0)
    elif ty=='에스퍼':
        t=T(0.45); s=np.sin(2*np.pi*np.cumsum(500+300*t/0.45+40*np.sin(2*np.pi*9*t))/SR)*env(len(t),0.05,0.4,3); b=place(b,s*0.5,0)
        b=place(b,np.sin(2*np.pi*np.cumsum(750+450*t/0.45+60*np.sin(2*np.pi*9*t))/SR)*env(len(t),0.05,0.4,3)*0.25,0)
    elif ty=='벌레':
        t=T(0.3); s=(np.mod(t*190,1)*2-1)*(0.5+0.5*np.sin(2*np.pi*32*t)); b=place(b,lp(s,2500)*env(len(t),0.01,0.25,4)*0.5,0)
    elif ty=='바위':
        for k in range(4): b=place(b,lp(noise(0.08),1500)*env(int(SR*0.08),0.002,0.06,5)*0.7,k*0.05)
        b=place(b,thud(100,0.25,8)*0.7,0)
    elif ty=='고스트':
        t=T(0.55); s=np.sin(2*np.pi*np.cumsum(700*np.exp(-t*2)+150+25*np.sin(2*np.pi*6*t))/SR)*env(len(t),0.08,0.45,3)*0.5
        b=place(b,s,0); b=place(b,bp(noise(0.5),300,1200)*env(int(SR*0.5),0.1,0.4,3)*0.25,0)
    elif ty=='드래곤':
        t=T(0.5); s=(np.mod(np.cumsum(90+60*t/0.5)/SR,1)*2-1); s=lp(s,900)*(0.7+0.3*np.sin(2*np.pi*14*t))*env(len(t),0.05,0.45,3)
        b=place(b,s*0.7,0); b=place(b,whoosh(0.3,300,1500)*0.3,0.1)
    elif ty=='악':
        b=place(b,lp(whoosh(0.3,300,1600,False),2000)*0.7,0); b=place(b,thud(80,0.25,6)*0.6,0.1)
    elif ty=='강철':
        b=place(b,metal(1200,0.5)*0.5,0); b=place(b,thud(200,0.08,15)*0.4,0)
    elif ty=='페어리':
        for k,m in enumerate([88,91,95,100,103]): b=place(b,bell(N(m),0.3,0.1)*0.35,k*0.04)
    return b
TYPES=['노말','불꽃','물','풀','전기','얼음','격투','독','땅','비행','에스퍼','벌레','바위','고스트','드래곤','악','강철','페어리']
EN={'노말':'normal','불꽃':'fire','물':'water','풀':'grass','전기':'electric','얼음':'ice','격투':'fighting','독':'poison','땅':'ground','비행':'flying','에스퍼':'psychic','벌레':'bug','바위':'rock','고스트':'ghost','드래곤':'dragon','악':'dark','강철':'steel','페어리':'fairy'}
for ty in TYPES: fin(snd_type(ty),'t-'+EN[ty],0.35,0.15)

# signature (5/6 cost)
def sig(name):
    b=np.zeros(1)
    if name=='fang':
        b=place(b,whoosh(0.15,1500,4000)*0.5,0); b=place(b,metal(2200,0.15)*0.3,0.12); b=place(b,snd_type('불꽃')*0.9,0.14)
    elif name=='scissor':
        for k in range(2): b=place(b,hp(whoosh(0.12,2000,7000),1500)*0.8,k*0.1); b=place(b,metal(3000,0.2)*0.25,k*0.1+0.08)
    elif name=='bullet':
        for k in range(3): b=place(b,thud(260,0.1,18)*0.8,k*0.07); b=place(b,metal(1600+k*200,0.18)*0.35,k*0.07)
    elif name=='axe':
        b=place(b,whoosh(0.25,400,2000)*0.6,0); b=place(b,thud(80,0.4,5),0.22); b=place(b,snd_type('바위')*0.7,0.24)
    elif name=='ancient':
        t=T(0.8); b=place(b,lp(noise(0.8),600)*env(len(t),0.3,0.5,3)*0.5,0)
        for k,m in enumerate([55,62,67]): b=place(b,bell(N(m),0.9,0.2)*0.4,0.15+k*0.12)
        b=place(b,snd_type('바위'),0.55)
    elif name=='rest':
        t=T(0.9); s=lp(noise(0.9),500)*(0.5+0.5*np.sin(2*np.pi*1.4*t-1.5))*0.4; b=place(b,s,0)
        for k,m in enumerate([76,72,67]): b=place(b,bell(N(m),0.5,0.1)*0.3,k*0.2)
    elif name=='nova':
        t=T(1.2); s=np.sin(2*np.pi*np.cumsum(200+1200*(t/1.2)**2)/SR)*np.minimum(1,t/1.0)*0.35; b=place(b,s,0)
        for k,m in enumerate([72,79,84,88,91,96]): b=place(b,bell(N(m),1.2,0.3)*0.4,1.1+k*0.02)
        b=place(b,lp(noise(0.8),3000)*env(int(SR*0.8),0.005,0.7,3)*0.5,1.1)
    elif name=='aria':
        for k,m in enumerate([72,76,79,84,79,76]): b=place(b,bell(N(m),0.5,0.15)*0.35,k*0.09)
        b=place(b,snd_type('물')*0.6,0.1); b=place(b,snd_type('물')*0.5,0.35)
    elif name=='irondef':
        b=place(b,metal(700,0.9)*0.5,0); b=place(b,metal(1050,0.8)*0.35,0.12)
        t=T(0.6); b=place(b,np.sin(2*np.pi*np.cumsum(300+500*t/0.6)/SR)*env(len(t),0.2,0.4,3)*0.2,0.05)
    elif name=='ragefist':
        b=place(b,snd_type('고스트')*0.6,0); b=place(b,thud(60,0.5,4)*1.0,0.3); b=place(b,lp(noise(0.3),800)*env(int(SR*0.3),0.002,0.25,4)*0.6,0.3)
    elif name=='waterfall':
        b=place(b,bp(noise(1.0),300,3000)*env(int(SR*1.0),0.2,0.8,3)*0.6,0); b=place(b,thud(70,0.4,5)*0.8,0.6)
    elif name=='meteor':
        for k in range(3): b=place(b,whoosh(0.4,3000,400,False)*0.5,k*0.18); b=place(b,thud(70,0.35,5)*0.8,k*0.18+0.35); b=place(b,lp(noise(0.3),1200)*env(int(SR*0.3),0.002,0.25,4)*0.4,k*0.18+0.35)
    elif name=='shadowball':
        t=T(0.5); s=lp(noise(0.5),700)*np.sin(np.linspace(0,np.pi,len(t)))*0.5; b=place(b,s,0); b=place(b,snd_type('고스트')*0.6,0); b=place(b,thud(90,0.3,6)*0.7,0.45)
    elif name=='future':
        t=T(0.8); b=place(b,np.sin(2*np.pi*np.cumsum(300+900*t/0.8+50*np.sin(2*np.pi*7*t))/SR)*env(len(t),0.3,0.5,3)*0.4,0)
        for k,m in enumerate([84,91,96]): b=place(b,bell(N(m),0.7,0.2)*0.35,0.5+k*0.05)
    elif name=='psystrike':
        t=T(0.9); s=sum(np.sin(2*np.pi*np.cumsum(f*(1+0.8*t/0.9)+30*np.sin(2*np.pi*11*t))/SR) for f in [220,330,440])*env(len(t),0.15,0.7,3)*0.25
        b=place(b,s,0); b=place(b,thud(60,0.5,4)*0.9,0.55); b=place(b,lp(noise(0.5),2000)*env(int(SR*0.5),0.002,0.4,4)*0.4,0.55)
    elif name=='sheercold':
        b=place(b,hp(noise(1.0),3000)*env(int(SR*1.0),0.3,0.7,3)*0.4,0)
        for k in range(8): b=place(b,bell(2000+rng.integers(0,3000),0.4,0.05)*0.25,0.1+k*0.08)
        b=place(b,whoosh(0.8,800,3000)*0.3,0)
    elif name=='thunder':
        b=place(b,crackle(0.2,200,5000)*0.6,0); b=place(b,lp(noise(1.0),900)*env(int(SR*1.0),0.005,0.9,3)*0.9,0.05); b=place(b,thud(50,0.6,3)*0.8,0.05)
    elif name=='fireblast':
        b=place(b,whoosh(0.3,500,3000)*0.4,0); b=place(b,lp(noise(0.8),2000)*env(int(SR*0.8),0.02,0.7,3)*0.8,0.25); b=place(b,crackle(0.7,120)*0.5,0.25); b=place(b,thud(60,0.5,3)*0.8,0.25)
    elif name=='ragefire':
        b=place(b,whoosh(0.2,800,3000)*0.4,0); b=place(b,snd_type('불꽃'),0.15); b=place(b,thud(70,0.4,4)*0.8,0.15)
    elif name=='rockfall':
        for k in range(3): b=place(b,whoosh(0.25,2500,600,False)*0.3,k*0.08); b=place(b,snd_type('바위')*0.7,0.2+k*0.08)
    return b
for nm in ['fang','scissor','bullet','axe','ancient','rest','nova','aria','irondef','ragefist','waterfall','meteor','shadowball','future','psystrike','sheercold','thunder','fireblast','ragefire','rockfall']:
    fin(sig(nm),'sig-'+nm,0.6,0.22)
print('done')
