import fs from 'node:fs/promises'




export async function getBase64File(path: string) {
    
    try {
        const rawFileData = await fs.readFile(path);
        // console.log('read file ', path, '=', rawFileData)
        return rawFileData.toString('base64');
    } catch(err) {
        console.error(err)
    }    
}





