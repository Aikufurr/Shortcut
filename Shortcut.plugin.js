//META{"name":"Shortcut","website":"https://github.com/Aikufurr/Shortcut","source":"https://github.com/Aikufurr/Shortcut/blob/master/Shortcut.plugin.js"}*//


class Shortcut {
    getName() { return "Shortcut"; }
    getDescription() { return "Ever wanted the ability to have shortcuts in Discord? Well now you can!  -  If the buttons don't work in settings, restart the plugin."; }
    getVersion() { return "0.1.0"; }
    getAuthor() { return "Aikufurr"; }

    constructor() {
        this.classesDefault = {
            chat: "chat-3bRxxu",
            searchBar: "searchBar-2_Yu-C",
            messagesWrapper: "messagesWrapper-3lZDfY"
        };
        this.classesNormalized = {
            appMount: "da-appMount",
            chat: "da-chat",
            searchBar: "da-searchBar",
            messagesWrapper: "da-messagesWrapper"
        };
        this.classes = this.classesDefault;
    }


    load() { this.log('Loaded'); }

    start() {
        this.log('Starting');

        this.Shortcuts = BdApi.loadData('Shortcut', 'shortcuts') || {};
        console.log(this.Shortcuts)
        if (Object.keys(this.Shortcuts).length === 0) {
            console.log("Generating file...")
            var obj = {
                "0": {
                    "0": "hello",
                    "1": "Hello ARG0"
                },
                "1": {
                    "0": "owo",
                    "1": "owo what's this? notices ARG0"
                },
                "2": {
                    "0": "hey",
                    "1": "Hey ARG0, how are chu ARG1"
                }
            }
            BdApi.saveData('Shortcut', 'shortcuts', obj);
            this.Shortcuts = BdApi.loadData('Shortcut', 'shortcuts') || {};
            console.log("Generated file!")
        }

        let libraryScript = document.getElementById('zeresLibraryScript');
        if (!libraryScript || (window.ZeresLibrary && window.ZeresLibrary.isOutdated)) {
            if (libraryScript) libraryScript.parentElement.removeChild(libraryScript);
            libraryScript = document.createElement("script");
            libraryScript.setAttribute("type", "text/javascript");
            libraryScript.setAttribute("src", "https://cdn.jsdelivr.net/gh/Aikufurr/WordEnd/PluginLibrary.js");
            libraryScript.setAttribute("id", "zeresLibraryScript");
            document.head.appendChild(libraryScript);
        }

        this.Entered = false;

        this.initialized = false;
        if (window.ZeresLibrary) this.initialize();
        else libraryScript.addEventListener("load", () => { this.initialize(); });
        // Fallback in case load fails to fire (https://github.com/planetarian/BetterDiscordPlugins/issues/2)
        setTimeout(this.initialize.bind(this), 5000);

    }

    error(text) {
        try {
            PluginUtilities.showToast(`[${this.getName()}] Error: ${text}`, { type: 'error' });
        } catch (err) {}
        return console.error(`[%c${this.getName()}%c] ${text}`,
            'color: #F77; text-shadow: 0 0 1px black, 0 0 2px black, 0 0 3px black;', '');
    }

    observer({ addedNodes, removedNodes }) {
        if (!this.classes || !addedNodes || !addedNodes[0] || !addedNodes[0].classList) return;
        let cl = addedNodes[0].classList;

        if (cl.contains(this.classes.searchBar) ||
            cl.contains(this.classes.chat) ||
            cl.contains(this.classes.messagesWrapper)) {
            this.update();
        }
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.update();

        try {
            PluginUtilities.checkForUpdate(this.getName(), this.getVersion(),
                "https://cdn.jsdelivr.net/gh/Aikufurr/Shortcut/Shortcut.plugin.js");
        } catch (err) {
            this.error("Couldn't update");
        }

        this.log("Initialized");
    }

    stop() {
        $('.' + this.classes.chat + ' textarea').off('keydown.shortcut');
        this.log('Stopped');
    }

    unload() { this.log('Unloaded'); }

    log(text) {
        return console.log(`[%c${this.getName()}%c] ${text}`,
            'color: #F77; text-shadow: 0 0 1px black, 0 0 2px black, 0 0 3px black;', '');
    }


    onSwitch() {}

    update() {
        let textArea = $('.' + this.classes.chat + ' textarea');
        if (!textArea.length) return;

        let inputBox = textArea[0];
        textArea.off('keydown.shortcut').on('keydown.shortcut', (e) => {
            // Corrupt text either when we press enter or tab-complete
            if ((e.which == 13 || e.which == 9) && inputBox.value) {
                let cursorPos = inputBox.selectionEnd;
                let value = inputBox.value;
                let tailLen = value.length - cursorPos;

                // If we pressed Tab, perform corruption only if the cursor is right after the closing braces.
                if (e.which == 9 && !value.substring(0, inputBox.selectionEnd).endsWith(':'))
                    return;
                try {
                    this.Shortcuts = BdApi.loadData('Shortcut', 'shortcuts') || {};

                    let regex = /^\/(.*?) /g;
                    //console.log("Testing")
                    if (regex.test(value)) {
                        //console.log("Passed")
                        var cmd = value.match(regex).toString().replace("/", "").toString().replace(" ", "");
                        //console.log("cmd " + cmd)
                        if (cmd == "") { return; }

                        var argregex = /{(.*?)}/g;

                        var args = value.split(cmd + " ")[1].match(argregex).toString().split(',') || "";
                        //console.log("args " + args)

                        var replace = "";

                        var objLen = Object.keys(this.Shortcuts).length;
                        //console.log("Looping")
                        var i;
                        for (i = 0; i < objLen; i++) {
                            var a = this.Shortcuts[i][0];
                            var b = this.Shortcuts[i][1];

                            if (a == cmd) {
                                replace = b;
                                break;
                            }

                        }

                        var argsLen = (replace.match(/ARG/g) || []).length;

                        //console.log("REGEXargsLen " + argsLen);
                        //console.log("argsLen " + args.length);

                        //console.log("Replace with RAW: " + replace);

                        if (!this.Entered) {
                            e.preventDefault();
                            this.Entered = false;
                        } else {
                            this.Entered = true;
                        }

                        try {
                            var i;
                            for (i = 0; i < argsLen; i++) {
                                //console.log("Loop: " + i)
                                replace = replace.replace("ARG" + i, args[i].replace("{", "").toString().replace("}", ""))
                            }
                        } catch (e) {
                            this.log(e)
                        }

                        //console.log("output " + replace)


                        value = replace;
                        if (value.length > 1800) {
                            PluginUtilities.showToast("This message would exceed the 2000-character limit.\n\nLength including corruption: " + value.length, { type: 'error' });
                            e.preventDefault();
                            return;
                        }
                        inputBox.focus();
                        inputBox.select();
                        document.execCommand("insertText", false, value);

                        // If we're using tab-completion, keep the cursor position, in case we were in the middle of a line
                        if (e.which == 9) {
                            let newCursorPos = value.length - tailLen;
                            inputBox.setSelectionRange(newCursorPos, newCursorPos);
                        }
                    }
                } catch (err) {
                    //console.log(err.message);
                }
            }
        });

        this.initialized = true;
    }
    getSettingsPanel() {
        const div = document.createElement('div');
        const button = document.createElement('button');
        const jq = document.createElement("script");
        jq.setAttribute('type', 'text/javascript');
        jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"
        document.head.appendChild(jq)
        const se = document.createElement("script")
        se.setAttribute('type', 'text/javascript');
        se.innerHTML = `$(function() {var tr, selected;

            $('#ShortcutTable').on('click', "td", function() {
                tr = $(this).closest('tr');

                if (selected) {
                    $('#ShortcutTable').find('span').remove()
                    selected = null;
                }

                //tr.addClass("Shortcuthighlight");
                tr.before('<span style="display: inline;float:left;"> Selected ˅</span>');
                selected = tr;
            });

            $("#ShortcutRemove").on("click", function() {
                $('#ShortcutTable').find('span').remove()
                tr.remove();
            });
            $("#ShortcutAdd").on("click", function() {
                $("#ShortcutTable").append('<tr class="text_data"> <td><input value="" style="color: white; background-color: rgba(0, 0, 0, 0.2); border: none; border-radius: 5px; height: 40px; padding: 10px; width: 100%;margin:2.5%;border:2px solid white;"></td> <td><input value="" style="color: white; background-color: rgba(0, 0, 0, 0.2); border: none; border-radius: 5px; height: 40px; padding: 10px; width: 200%;margin:2.5%;border:2px solid white;"></td> </tr> ');
            });
            
        
        });`
        document.head.appendChild(se)
        const options = document.createElement('div');
        options.style = "color:white;margin:20px;background-color:rgba(0,0,0,0.2)padding:10px;text-align:center;display: inline;";
        var objLen = Object.keys(this.Shortcuts).length
        var list = ""
        var i;
        for (i = 0; i < objLen; i++) {
            var a = this.Shortcuts[i][0];
            var b = this.Shortcuts[i][1];
            list += `<tr class="text_data"> <td><input value="` + a + `" style="color: white; background-color: rgba(0, 0, 0, 0.2); border: none; border-radius: 5px; height: 40px; padding: 10px; width: 100%;margin:2.5%;border:2px solid white;"></td> <td><input value="` + b + `" style="color: white; background-color: rgba(0, 0, 0, 0.2); border: none; border-radius: 5px; height: 40px; padding: 10px; width: 200%;margin:2.5%;border:2px solid white;"></td> </tr>`
        }

        options.innerHTML = `        
        <style>
        .ac-selected{background-color:#7289da;}
        #last {
            overflow:auto;
            display:block;
        }
        #ShortcutButton{
            text-align: center;
            }
        .Shortcuthighlight {
            background-color: #7188d8;
            background-color: rgba(0, 0, 0, 0.2);
        }
        </style>
        <div style="padding: 1px 1em 1em 1em; font-size: large;"><h1 style="text-align: left;"><strong>Shortcuts</strong></h1></div>
        <table id="ShortcutTable" style="padding: 2px 1em 0 1em;border-collapse:collapse;">` + list + `</table>
        <br>
        <div type="text" class="ac-replacer-field">
        <button id="ShortcutAdd" style="border: none; border-radius: 5px; height: 40px; padding: 10px; width: 100%;width:45%;margin:2.5%;border:2px solid white;" class="button-38aScr lookFilled-1Gx00P colorBrand-3pXr91 sizeMedium-1AC_Sl grow-q77ONN">
        Add New Shortcut</button>
        <button id="ShortcutRemove" style="border: none; border-radius: 5px; height: 40px; padding: 10px; width: 100%;width:45%;margin:2.5%;border:2px solid white;" class="button-38aScr lookFilled-1Gx00P colorBrand-3pXr91 sizeMedium-1AC_Sl grow-q77ONN">
        Remove Selected</button>
        </div>
        </div>`;
        button.style = "color:white;margin:20px;background-color:rgba(0,0,0,0.2)padding:10px;text-align:center;display: inline;background-color:#7289da;border: none; border-radius: 5px; height: 40px; padding: 10px; width: 100%;width:45%;margin:2.5%;border:2px solid white;"
        button.style.cssFloat = 'left';
        button.class = "button-38aScr lookFilled-1Gx00P colorBrand-3pXr91 sizeMedium-1AC_Sl grow-q77ONN"
        button.innerHTML = `Save`
        button.addEventListener('click', _ => {
            var tbl = document.getElementById("ShortcutTable");
            var rCount = tbl.rows.length;
            try {

                var obj = {}

                var i;
                for (i = 0; i < rCount; i++) {
                    obj[i] = { 0: tbl.rows[i].cells[0].children[0].value, 1: tbl.rows[i].cells[1].children[0].value }
                }
            } catch (e) {
                //console.log(e)
            }
            BdApi.saveData('Shortcut', 'shortcuts', obj);
            this.Shortcuts = BdApi.loadData('Shortcut', 'shortcuts') || {};
        });
        div.appendChild(options)
        div.appendChild(button);
        return div;
    }
}

/*@end @*/
