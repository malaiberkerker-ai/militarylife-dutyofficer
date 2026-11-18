// Local synthesized tones: no audio downloads or external services.
export function createDutySounds({AudioContext=globalThis.AudioContext??globalThis.webkitAudioContext,setInterval:repeat=globalThis.setInterval,clearInterval:cancel=globalThis.clearInterval}={}){
 let context=null,muted=false,ringKey=null,timer=null;const playing=new Set();
 function stop(){if(timer!==null)cancel(timer);timer=null;ringKey=null;for(const node of playing){try{node.stop();}catch{}try{node.disconnect();}catch{}}playing.clear();}
 function tone(frequency,delay,length,volume=.045){if(!context||context.state!=='running'||muted)return;const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+delay;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.015);gain.gain.setValueAtTime(volume,start+length-.025);gain.gain.linearRampToValueAtTime(0,start+length);oscillator.connect(gain);gain.connect(context.destination);playing.add(oscillator);oscillator.onended=()=>{playing.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(start);oscillator.stop(start+length);}
 function ring(){for(const delay of [0,.24,.6,.84]){tone(660,delay,.18);tone(880,delay,.18,.02);}}
 async function unlock(){if(muted)return false;try{context??=AudioContext?new AudioContext():null;if(context?.state==='suspended')await context.resume();return context?.state==='running';}catch{return false;}}
 return {unlock,stop,get ready(){return context?.state==='running';},get muted(){return muted;},setMuted(value){muted=!!value;if(muted)stop();},line(){tone(1046,0,.13);tone(1568,.16,.17);},sync(key,paused){if(paused||muted){stop();return;}if(!key||context?.state!=='running'){if(ringKey!==null)stop();return;}if(key===ringKey)return;stop();ringKey=key;ring();timer=repeat(ring,2800);}};
}

