import * as Base from 'atma-io-middleware-base'
import process from './compiler'


export = Base.create({
	name: 'atma-loader-less',
    textOnly: true,
    cacheable: true,
    defaultOptions: {
        mimeType: 'text/css',
        extensions: [ 'less' ],
        base: '/',
        less: {

        }
    },
    process
});
