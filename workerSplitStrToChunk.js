onmessage = function (e) {
    // *最後一定會回覆一個 fullChunk = false 的結果
    //
    // request
    // {
    //     data: "Decode result",
    //     chunkSize,
    //     chunkString,
    // }
    // response
    // {
    //     chunkString: "切完剩餘",
    //     fullChunks:
    // }

    const rq = e.data;
    // const chunkSize = request.chunkSize;
    let chunkString = rq.chunkString;
    let fullChunks = [];
    const needLen = rq.chunkSize - chunkString.length;
    // e.data.data;

    if (rq.data.length < needLen) {
        chunkString += rq.data;
    } else if (rq.data.length === needLen) {
        chunkString += rq.data;

        fullChunks.push(chunkString);
        // postMessage({
        //     fullChunk: true,
        //     result: chunkString,
        // });
    } else if (rq.data.length > needLen) {
        chunkString += rq.data.slice(0, needLen);

        fullChunks.push(chunkString);
        // postMessage({
        //     fullChunk: true,
        //     result: chunkString,
        // });

        let pos = needLen;
        while (rq.data.length - pos >= rq.chunkSize) {
            // chunkString = rq.data.slice(pos, pos + rq.chunkSize);

            fullChunks.push(rq.data.slice(pos, pos + rq.chunkSize));
            // postMessage({
            //     fullChunk: true,
            //     result: chunkString,
            // });

            pos = pos + rq.chunkSize;
        }

        if (rq.data.length - pos > 0) {
            chunkString = rq.data.slice(pos, rq.data.length);
        } else {
            chunkString = "";
        }
    }

    postMessage({
        chunkString,
        fullChunks,
    });
};
