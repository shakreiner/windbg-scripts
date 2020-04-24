# Break On Process

This WinDBG script enables you to break in the context of new processes based on executable name and command line arguments while kernel-debugging.

## Usage

1. Load the script
```shell
1: kd> .scriptload "C:\BreakOnProcess.js"
Break on new process (for KD)

Usage: 
  !breakonprocess <name>[, <commandline>] 
          or 
  dx @$scriptContents.breakOnProcess(<name>[, <commandline>])

Parameters are not case sensitive 
New processes will match if their command line contains the commandline requested
JavaScript script successfully loaded from 'C:\BreakOnProcess.js'
```
2.  Set a breakpoint on the desired process (`commandline` parameter is optional)
```shell
1: kd> !breakonprocess "svchost.exe", "-k NetworkService -s TermService"
    [+] Breaking in new 'svchost.exe' processes
    @$breakonprocess("svchost.exe", "-k NetworkService -s TermService")
```

3.  Go

```shell
1: kd> g
```

4.  Trigger the process in the host and you'll break in its context
```shell
1: kd> g
Breakpoint 1 hit
nt!DbgBreakPointWithStatus:
fffff805`237ca1e0 cc              int     3
```

