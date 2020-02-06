import Error from './Error';

export default class Cube {
    body: string
    name: string
    result: string
    filename: string

    constructor(body: string, filename: string) {
        this.body = body;
        this.name = body.match(/Cube (.*?):/)[1];
        this.filename = filename;
    }

    public async transpile(code: string) {
        return new Promise((resolve, reject) => {
            if (/wait\("(.*?)"\)/.test(this.body)) {
                let prop_matches = this.body.match(/wait\("(.*?)"\)/g);
                prop_matches.forEach((prop: string, prop_id: number) => {
                    let prop_name = prop.match(/"(.*?)"/)[1];
                    let find_all_sends = new RegExp(`${this.name}.send\\("${prop_name}", ?(.*)\\)`, 'g');
                    if (find_all_sends.test(code)) {
                        let matches = code.match(find_all_sends);
                        let cases = "";
                        matches.forEach((match, match_id) => {
                            let match_prop = match.match(/"(.*?)" ?,/)[1];
                            code = code.replace(match, `${this.name}("${match_prop}", ${match_id})`);
                            let given_code = match.match(/, ?(.*)\)/)[1];
                            cases += `\tcase ${match_id}:\n\t\t\t${given_code}\n\t\t\tbreak;\n\t`
                        })   
                        let cube = `//Cube: '${prop_name}'\nif (cube == '${prop_name}') {\n\tswitch(opc) {\n\t${cases}\n\t}\n}`
                        code = code.replace(prop, cube);
                    } else {
                        code = code.replace(prop, `// Cube: '${prop_name}'`);
                    }
                })
                code = code.replace(/declare Cube (.*?):([\s\S]*?)}/g, 'fun $1(cube, opc) {$2}');
                code = code.replace(/(.*?).send\("(.*?)", ?(.*)\)/g, '$1("$2", $3)')
                this.result = code;
                resolve()
            } else {
                code = code.replace(/declare Cube (.*?):([\s\S]*?)}/g, 'fun $1(cube, opc) {$2}');
                if (/(.*?).send\("(.*?)", ?(.*)\)/g.test(code)) {
                    let probably_prop = code.match(/(.*?).send\("(.*?)", ?(.*)\)/)[2];
                    new Error({
                        text: `Cube '${this.name}' does not wait '${probably_prop}' prop.`,
                        at: `${this.filename}.feno`,
                        solution: `Don't send props to cubes that doesn't wait any prop.`,
                        info: "https://fenolang.herokuapp.com/docs/cubes"
                    })
                    reject()
                } else {
                    this.result = code;
                    resolve();
                }
            }
        })
    }
}