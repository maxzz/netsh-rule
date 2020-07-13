# Overview

netsh-rule will generate a file that allows to apply firewall rule to the specified application or all executables in the specified folder.

## Install

```npm -g i netsh-rule```

or

```yarn global add netsh-rule```

## Usage

```netsh-rule <filename | folder> [options]```

option  | description
--------|--
name    | The rule name (name will be generated if missing name)
program | Absolute path to \<filename \| folder>
enable  | Enable rule: yes \| no (default: yes)
dir     | The rule is inbound or outbound: in \| out \| both (default: both i.e. in and out)
action  | The action for rule: allow \| block (default: block)
profile | Apply rule for: public \| private \| domain (default: public, private, domain)
format  | Output format can be batch file, powershell, or javascript: bat \| ps1 \| js (default: bat)

# \<netsh advfirewall firewall add rule> quick reference

## Usage:
```netsh advfirewall firewall add rule```

*    name = \<string\>
*    dir = in \| out
*    action = allow \| block \| bypass
*    [ program = \<program path\> ]
*    [ service = \<service short name\> \| any ]
*    [ description = \<string\> ]
*    [ enable = yes \| no (default = yes) ]
*    [ profile = public \| private \| domain \| any[ ,... ] ]
*    [ localip = any \| \<IPv4 address\> \| \<IPv6 address\> \| \<subnet\> \| \<range\> \| \<list\> ]
*    [ remoteip = any \| localsubnet \| dns \| dhcp \| wins \| defaultgateway \| \<IPv4 address\> \| \<IPv6 address\> \| \<subnet\> \| \<range\> \| \<list\> ]
*    [ localport = 0-65535 \| \<port range\>[ ,... ] \| RPC \| RPC-EPMap \| IPHTTPS \| any (default = any) ]
*    [ remoteport = 0-65535 \| \<port range\>[ ,... ] \| any (default = any) ]
*    [ protocol = 0-255 \| icmpv4 \| icmpv6 \| icmpv4:type,code \| icmpv6:type,code \| tcp \| udp \| any (default = any) ]
*    [ interfacetype = wireless \| lan \| ras \| any ]
*    [ rmtcomputergrp = \<SDDL string\> ]
*    [ rmtusrgrp = \<SDDL string\> ]
*    [ edge = yes \| deferapp \| deferuser \| no (default = no) ]
*    [ security = authenticate \| authenc \| authdynenc \| authnoencap \| notrequired (default = notrequired) ]

## Remarks:

 - Add a new inbound or outbound rule to the firewall policy.
 - Rule name should be unique and cannot be "all".
 - If a remote computer or user group is specified, security must be
   authenticate, authenc, authdynenc, or authnoencap.
 - Setting security to authdynenc allows systems to dynamically
   negotiate the use of encryption for traffic that matches
   a given Windows Firewall rule. Encryption is negotiated based on
   existing connection security rule properties. This option
   enables the ability of a machine to accept the first TCP
   or UDP packet of an inbound IPsec connection as long as
   it is secured, but not encrypted, using IPsec.
   Once the first packet is processed, the server will
   re-negotiate the connection and upgrade it so that
   all subsequent communications are fully encrypted.
 - If action=bypass, the remote computer group must be specified when dir=in.
 - If service=any, the rule applies only to services.
 - ICMP type or code can be "any".
 - Edge can only be specified for inbound rules.
 - AuthEnc and authnoencap cannot be used together.
 - Authdynenc is valid only when dir=in.
 - When authnoencap is set, the security=authenticate option becomes an
   optional parameter.

## Examples:

* Add an inbound rule with no encapsulation security for messenger.exe:
  
    ```netsh advfirewall firewall add rule name="allow messenger" dir=in program="c:\programfiles\messenger\msmsgs.exe" security=authnoencap action=allow```

* Add an outbound rule for port 80:
  
    ```netsh advfirewall firewall add rule name="allow80" protocol=TCP dir=out localport=80 action=block```

* Add an inbound rule requiring security and encryption for TCP port 80 traffic:
  
    ```netsh advfirewall firewall add rule name="Require Encryption for Inbound TCP/80" protocol=TCP dir=in localport=80 security=authdynenc action=allow```

* Add an inbound rule for messenger.exe and require security
  
    ```netsh advfirewall firewall add rule name="allow messenger" dir=in program="c:\program files\messenger\msmsgs.exe" security=authenticate action=allow```

* Add an authenticated firewall bypass rule for group acmedomain\scanners identified by a SDDL string:
  
    ```netsh advfirewall firewall add rule name="allow scanners" dir=in rmtcomputergrp=<SDDL string> action=bypass security=authenticate```

* Add an outbound allow rule for local ports 5000-5010 for udp-
* Add rule name="Allow port range" dir=out protocol=udp localport=5000-5010 action=allow
