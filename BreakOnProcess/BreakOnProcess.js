// @ShakReiner

"use strict";

// General functions
const execute = cmd => host.namespace.Debugger.Utility.Control.ExecuteCommand(cmd);
const log  = msg => host.diagnostics.debugLog(`${msg}\n`);

// Handle NtCreateUserProcess breaks
function handleProcessCreation(processName, processCommand)
{
    var PROCESS_PARAM_PARAM = 8;            // parameter index of _RTL_USER_PROCESS_PARAMETERS
    var NTCREATEUSERPROCSES_PARAM_NUM = 11  // number of parameters of nt!NtCreateUserProcess

    // Get the stack pointer to access arguments
    var rsp = host.currentThread.Registers.User.rsp;
    
    // Read all arguments. Add 1 since the first element on the stack is the return address
    var pUserProcessParams = host.memory.readMemoryValues(rsp, NTCREATEUSERPROCSES_PARAM_NUM+1, 8)[PROCESS_PARAM_PARAM+1];
    
    // Cast to _RTL_USER_PROCESS_PARAMETERS
    var procParams = host.createTypedObject(pUserProcessParams, "nt", "_RTL_USER_PROCESS_PARAMETERS");
    
    // Get the executable name from process parameters
    var imagePathName = procParams.ImagePathName.toString().slice(1,-1).split("\\");
    var fileName = imagePathName[imagePathName.length-1];
    
    // Continue execution if process doesn't match name/command
    if (processName.toUpperCase() != fileName.toUpperCase()){return false;}
    if (processCommand)
    {
        let commandLinePresent = procParams.CommandLine.toString().toUpperCase().includes(processCommand.toUpperCase());
        if (!commandLinePresent){return false;}
    }
    
    // Get the address of the new process handle
    var rcx = host.currentThread.Registers.User.rcx;
    
    // Continue execution until return so the handle will be created
    execute("pt")
    
    // Get the _EPROCESS of the new process
    var handle = host.memory.readMemoryValues(rcx, 1, 8);
    var eprocess = host.currentProcess.Io.Handles[handle].Object.UnderlyingObject.targetLocation.address;
    
    // Set process to the new created one
    execute(`.process /i ${eprocess}`);
    execute("g");

    return true;
}

function breakOnProcess(processName, processCommand)
{
    // Set a breakpoint
    var bp = host.namespace.Debugger.Utility.Control.SetBreakpointAtOffset('NtCreateUserProcess', 0, 'nt');
    var args = `"${processName}"`;
    if (processCommand)
    {
        args += `, "${processCommand}"`;
    }
    bp.Condition =  `@$scriptContents.handleProcessCreation(${args})`;
    
    log(`[+] Breaking in new '${processName}' processes`);
}

function initializeScript()
{
    log(`Break on new process (for KD)\n
Usage: 
        !breakonprocess <name>[, <commandline>] 
                           or 
        dx @$scriptContents.breakOnProcess(<name>[, <commandline>])
  
    Parameters are not case sensitive 
    New processes will match if their command line contains the commandline requested`)
       
    return [
        new host.apiVersionSupport(1, 3),
        new host.functionAlias(breakOnProcess, "breakonprocess")];
}