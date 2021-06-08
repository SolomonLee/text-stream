const loadSize = 0;
const valueSize = 0;
function loadChunkTextFile(
    /**  檔案位置URL */ path,
    /**  cb: Callback Function, 當取得一定長度的資料時, 回傳資料給 cb
     *| 資料格式: obj { data: "your chunk str" }
     *| 長度: chunkSize */ cb,
    /**  切分的檔案大小 */ chunkSize = 1024,
    /**  當 Worker 沒有回傳資料達到一定時間時, 將自動關閉, 時間單位: 毫秒 */ timeout = 60000
) {
    const workerLoadAndDecode = new Worker("workerLoadAndDecode.js");
    const workerSplitStrToChunk = new Worker("workerSplitStrToChunk.js");
    const workerSplitStrToChunkWorkList = [];
    let workerSplitStrToChunkIsWorking = false;
    let autoCloseWorkerTimer = -1;
    const state = { chunk: "", fullChunks: [], isLoadDone: false };

    const splitToChunkSize = (str) => {
        if (!workerSplitStrToChunkIsWorking) {
            workerSplitStrToChunkIsWorking = true;

            workerSplitStrToChunk.postMessage({
                data: str,
                chunkSize,
                chunkString: state.chunk,
            });
        } else {
            workerSplitStrToChunkWorkList.push(str);
        }
    };

    /** 回傳資料至 callback 函數 */
    const result = (isDone, errorMessage = "") => {
        cb({
            chunks: state.fullChunks,
            done: isDone,
            error: errorMessage.length > 0,
            errorMessage,
        });
        state.fullChunks = [];
    };

    /** 將 worker 取得的資料進行切割, 當超出 chunkSize 時, 將 call result(boolean), 回傳資料 */
    const chunkSplit = (str) => {
        splitToChunkSize(str);
    };

    /** 將 worker 取得的資料進行切割, 當超出 chunkSize 時, 將 call result(boolean), 回傳資料, 並回傳在 state 內資料, 且關閉 worker */
    const finalChunkSplit = (str) => {
        state.isLoadDone = true;
        splitToChunkSize(str);

        workerLoadAndDecode.terminate();
        clearTimeout(autoCloseWorkerTimer);
    };

    const setCloseWorkerTimer = () => {
        clearTimeout(autoCloseWorkerTimer);
        autoCloseWorkerTimer = setTimeout(() => {
            workerLoadAndDecode.terminate();
            workerSplitStrToChunk.terminate();
            result(false, "ERROR: WorkerTimeout!!");
        }, timeout);
    };

    workerLoadAndDecode.onmessage = (e) => {
        // e.data =
        // {
        //     done: false,
        //     result: decode data,
        // }
        setCloseWorkerTimer();
        if (!e.data.done) {
            chunkSplit(e.data.result);
        } else {
            finalChunkSplit(e.data.result);
        }
    };

    workerSplitStrToChunk.onmessage = (e) => {
        // e.data =
        // {
        //     chunkString: "切完剩餘",
        //     fullChunks:
        // }
        const rp = e.data;

        state.chunk = rp.chunkString;
        state.fullChunks = rp.fullChunks;
        if (state.fullChunks.length) {
            result(false);
        }

        workerSplitStrToChunkIsWorking = false;
        if (workerSplitStrToChunkWorkList.length > 0) {
            splitToChunkSize(workerSplitStrToChunkWorkList.splice(0, 1));
        } else {
            if (state.isLoadDone) {
                workerSplitStrToChunk.terminate();
                state.fullChunks.push(state.chunk);
                state.chunk = "";
                result(false);
                result(true);
            }
        }
    };

    workerLoadAndDecode.postMessage({ path });
    setCloseWorkerTimer();
}
