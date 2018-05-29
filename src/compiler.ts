import { Compiler, io } from 'atma-io-middleware-base'
import * as less from 'less'
import { class_Uri } from 'atma-utils'


export default function processFn(source: string, file, compiler: Compiler) {

    var uri = file.uri,
        paths = [uri.toLocalDir()],
        out = {
            error: null,
            content: null,
            sourceMap: null
        };

    let css, parser;
    let base = <string>compiler.getOption('base') || '/';
    if (base[0] === '/') {
        base = class_Uri.combine(process.cwd(), base);
    }

    paths.push(new class_Uri(base).toLocalDir());


    const options = {
        async: false,
        syncImport: true,

        sourceMap: {
            sourceMapURL: uri.file + '.map',
            sourceMapRootpath: 'file:///',
            outputSourceFiles: true,
        },

        filename: uri.toLocalFile(),
        paths: paths
    };

    less.render(source, options, function (error, data: Less.RenderOutput) {
        if (error) {
            out.content = out.error = error;
            return;
        }
        out.content = data.css;
        out.sourceMap = data.map;
    });

    return out;
}

function error_format(error) {
    return error.message
        + '\n\tat ('
        + error.filename
        + ':'
        + error.line
        + error.column
        + ')';
}