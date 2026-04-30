document.addEventListener("livewire:initialized",()=>{Livewire.on("saved",()=>{setTimeout(()=>{window.location.reload()},800)})});
