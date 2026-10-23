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

def sig(name):
    b=np.zeros(1)
    if name=='heatwave':
        b=place(b,whoosh(0.5,300,2200)*0.6,0); b=place(b,lp(noise(0.9),1800)*env(int(SR*0.9),0.15,0.7,3)*0.7,0.15)
        b=place(b,crackle(0.8,140)*0.5,0.2); b=place(b,thud(70,0.5,3)*0.7,0.2); b=place(b,snd_type('불꽃')*0.7,0.35)
    elif name=='heavyslam':
        b=place(b,whoosh(0.35,2500,500,False)*0.5,0); b=place(b,thud(45,0.7,3)*1.0,0.33); b=place(b,metal(500,0.6)*0.35,0.33)
        b=place(b,lp(noise(0.5),700)*env(int(SR*0.5),0.002,0.45,3)*0.8,0.33)
        for k in range(5): b=place(b,snd_type('바위')*0.35,0.55+k*0.09)
    elif name=='ambush':
        b=place(b,lp(whoosh(0.18,400,1800,False),2500)*0.6,0); b=place(b,hp(whoosh(0.1,3000,8000),2000)*0.8,0.16)
        b=place(b,metal(2600,0.2)*0.25,0.2); b=place(b,thud(110,0.2,10)*0.7,0.2)
    elif name=='bugbite':
        b=place(b,snd_type('벌레')*0.7,0)
        for k in range(3): b=place(b,thud(300,0.07,25)*0.7,0.12+k*0.08); b=place(b,hp(noise(0.03),2500)*env(int(SR*0.03),0.001,0.025,5)*0.5,0.12+k*0.08)
    elif name=='ghostdive':
        t=T(0.5); s=np.sin(2*np.pi*np.cumsum(500*np.exp(-t*4)+90)/SR)*env(len(t),0.2,0.3,3)*0.4; b=place(b,s,0)
        b=place(b,bp(noise(0.45),200,900)*env(int(SR*0.45),0.25,0.2,3)*0.35,0); b=place(b,snd_type('고스트')*0.6,0.35); b=place(b,thud(70,0.35,5)*0.8,0.45)
    return b
for nm in ['heatwave','heavyslam','ambush','bugbite','ghostdive']:
    fin(sig(nm),'sig-'+nm,0.6,0.22)
print('done')
