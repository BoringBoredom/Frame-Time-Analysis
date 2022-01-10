Chart.defaults.animation = false
Chart.defaults.events = []

const navigation = document.getElementById('navigation')
const exportButton = document.getElementById('export')

const instructions = document.getElementById('instructions')

const results = document.getElementById('results')
const benchmarks = document.getElementById('benchmarks')
const comparisons = document.getElementById('comparisons')
const comparison = document.getElementById('comparison')
const metric = document.getElementById('metric')

const crop = document.createElement('style')
document.head.append(crop)

let fileIndex = -1
const benches = []

document.addEventListener('dragenter', ev => {
    ev.stopPropagation()
    ev.preventDefault()
})
document.addEventListener('dragover', ev => {
    ev.stopPropagation()
    ev.preventDefault()
})
document.addEventListener('drop', async ev => {
    ev.stopPropagation()
    ev.preventDefault()
    for (const file of ev.dataTransfer.files) {
        const fileName = file.name
        if (fileName.endsWith('.csv')) {
            const index = ++fileIndex
            await new Promise((resolve, reject) => {
                Papa.parse(file, {
                    complete: (result) => {
                        processCSV(fileName, index, result.data)
                        resolve()
                    }
                })
            })
        }
        else if (fileName.endsWith('.json')) {
            const index = ++fileIndex
            processJSON(fileName, index, JSON.parse(await file.text()))
        }
    }
})

const comparisonChart = new Chart(comparison, {
    type: 'bar',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        indexAxis: 'y',
        scales: {
            x: {
                min: 0
            },
            y: {
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            datalabels: {
                anchor: 'start',
                clamp: true,
                align: 'end',
                font: {
                    weight: 700
                },
                color: 'rgb(0,0,0)'
            }
        }
    },
    plugins: [ChartDataLabels]
})

const colors = {
    'Max': 'rgb(255,255,0)',
    'Avg': 'rgb(255,215,0)',
    'Min': 'rgb(255,165,0)',
    '1 %ile': 'rgb(0,255,255)',
    '0.1 %ile': 'rgb(135,206,250)',
    '0.01 %ile': 'rgb(0,191,255)',
    '1 % low': 'rgb(152,251,152)',
    '0.1 % low': 'rgb(0,255,0)',
    '0.01 % low': 'rgb(50,205,50)'
}

function updateComparison() {
    comparisonChart.data.labels = benches.map(bench => bench.file_name)
    comparisonChart.data.datasets = [...metric.options].filter(option => option.selected).map(option => {
        const value = option.value
        return {
            label: value,
            data: benches.map(bench => bench[value]),
            backgroundColor: colors[value]
        }
    })
    comparisonChart.update()
}

function updateStats(bench, min, max) {
    let isOld
    if (min !== null || max !== null) {
        isOld = true
    }

    let frameTimes, benchmarkTime, frameCount

    if (isOld) {
        frameTimes = []
        frameCount = 0
        benchmarkTime = 0
        let tempBenchmarkTime = 0
        for (const present of bench.full_frame_times) {
            tempBenchmarkTime += present
            if (tempBenchmarkTime < min) {
                continue
            }

            if (tempBenchmarkTime > max) {
                break
            }

            benchmarkTime += present
            frameTimes.push(present)
            frameCount++
        }

        bench.frame_times = frameTimes
        bench.frame_count = frameCount
        bench.benchmark_time = benchmarkTime
    }
    else {
        frameTimes = bench.full_frame_times
        benchmarkTime = bench.full_benchmark_time

        frameCount = bench.full_frame_count
        bench.frame_count = frameCount
    }

    const sortedFrameTimes = [...frameTimes].sort((a, b) => b - a)

    bench['Max'] = (1000 / sortedFrameTimes[frameCount - 1]).toFixed(2)
    bench['Avg'] = (1000 / (benchmarkTime / frameCount)).toFixed(2)
    bench['Min'] = (1000 / sortedFrameTimes[0]).toFixed(2)

    const values = [1, 0.1, 0.01]

    for (const percentile of values) {
        const fps = 1000 / sortedFrameTimes[Math.ceil(percentile / 100 * frameCount) - 1]
        bench[`${percentile} %ile`] = fps.toFixed(2)
    }

    for (const low of values) {
        if (frameCount <= 0) {
            bench[`${low} % low`] = undefined
            continue
        }

        const wall = low / 100 * benchmarkTime
        let currentTotal = 0
        for (const present of sortedFrameTimes) {
            currentTotal += present
            if (currentTotal >= wall) {
                const fps = 1000 / present
                bench[`${low} % low`] = fps.toFixed(2)
                break
            }
        }
    }

    if (isOld) {
        updateBench(bench)
    }
    else {
        appendBench(bench)
    }
}

function updateBench(bench) {
    const barChart = bench.bar_chart
    barChart.data.datasets[0].data = [bench['Max'], bench['Avg'], bench['Min'], bench['1 %ile'], bench['0.1 %ile'], bench['0.01 %ile'], bench['1 % low'], bench['0.1 % low'], bench['0.01 % low']]
    barChart.update()

    const scatterChart = bench.scatter_chart
    scatterChart.data.datasets[0].label = `${bench.frame_count} frames`
    scatterChart.options.scales.x.min = parseInt(document.getElementById(`min-${bench.file_index}`).value)
    scatterChart.options.scales.x.max = parseInt(document.getElementById(`max-${bench.file_index}`).value)
    scatterChart.update()

    updateComparison()
}

function appendBench(bench) {
    const fileIndex = bench.file_index
    const elapsed = Math.ceil(bench.full_benchmark_time)
    const frameCount = bench.full_frame_count

    const droppedPercentage = Math.round(bench.dropped_frames / frameCount * 100)
    const allowsTearingPercentage = Math.round(bench.allows_tearing / frameCount * 100)
    const dwmNotifiedPercentage = Math.round(bench.dwm_notified / frameCount * 100)
    const wasBatchedPercentage = Math.round(bench.was_batched / frameCount * 100)

    benchmarks.insertAdjacentHTML('beforeend', `
        <div class="bench">
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Application</th>
                            <th>API</th>
                            <th>Present Mode</th>
                            <th>Duration (ms)</th>
                            <th>Sync Interval</th>
                            <th>Dropped Frames</th>
                            <th>Allows Tearing</th>
                            <th>DWM Notified</th>
                            <th>Was Batched</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${bench.file_name}</td>
                            <td>${bench.application ?? '?'}</td>
                            <td>${bench.runtime ?? '?'}</td>
                            <td>${bench.present_mode ?? '?'}</td>
                            <td>${elapsed}</td>
                            <td>${bench.sync_interval ?? '?'}</td>
                            <td>${bench.dropped_frames ?? '?'} / ${frameCount}${isNaN(droppedPercentage) ? '' : ` (${droppedPercentage} %)`}</td>
                            <td>${bench.allows_tearing ?? '?'} / ${frameCount}${isNaN(allowsTearingPercentage) ? '' : ` (${allowsTearingPercentage} %)`}</td>
                            <td>${bench.dwm_notified ?? '?'} / ${frameCount}${isNaN(dwmNotifiedPercentage) ? '' : ` (${dwmNotifiedPercentage} %)`}</td>
                            <td>${bench.was_batched ?? '?'} / ${frameCount}${isNaN(wasBatchedPercentage) ? '' : ` (${wasBatchedPercentage} %)`}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="charts">
                <div class="column">
                    <canvas id="bar-${fileIndex}">
                    </canvas>
                </div>
                <div class="column">
                    <canvas id="scatter-${fileIndex}">
                    </canvas>
                </div>
            </div>
            <div class="crop">
                <input id="min-${fileIndex}" class="input" type="number" value="0" min="0" max="${elapsed}">
                -
                <input id="max-${fileIndex}" class="input" type="number" value="${elapsed}" min="0" max="${elapsed}">
                ms
            </div>
        </div>
    `)

    bench.bar_chart = new Chart(document.getElementById(`bar-${fileIndex}`), {
        type: 'bar',
        data: {
            labels: ['Max', 'Avg', 'Min', '1 %ile', '0.1 %ile', '0.01 %ile', '1 % low', '0.1 % low', '0.01 % low'],
            datasets: [{
                label: 'FPS',
                data: [bench['Max'], bench['Avg'], bench['Min'], bench['1 %ile'], bench['0.1 %ile'], bench['0.01 %ile'], bench['1 % low'], bench['0.1 % low'], bench['0.01 % low']],
                backgroundColor: 'rgb(0,191,255)'
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    min: 0
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                datalabels: {
                    anchor: 'start',
                    clamp: true,
                    align: 'end',
                    font: {
                        weight: 700
                    },
                    color: 'rgb(0,0,0)'
                }
            }
        },
        plugins: [ChartDataLabels]
    })

    bench.scatter_chart = new Chart(document.getElementById(`scatter-${fileIndex}`), {
        type: 'scatter',
        data: {
            labels: bench.full_elapsed,
            datasets: [{
                label: `${frameCount} frames`,
                data: bench.full_frame_times,
                backgroundColor: 'rgb(0,191,255)',
                borderWidth: 0,
                radius: 2
            }]
        },
        options: {
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    min: 0,
                    max: elapsed
                }
            }
        }
    })

    const min = document.getElementById(`min-${fileIndex}`)
    const max = document.getElementById(`max-${fileIndex}`)

    const cropArgs = [bench, elapsed, min, max]

    min.addEventListener('keydown', ev => {
        validateCrop(ev, ...cropArgs)
    })

    min.addEventListener('blur', ev => {
        validateCrop(ev, ...cropArgs)
    })

    max.addEventListener('keydown', ev => {
        validateCrop(ev, ...cropArgs)
    })

    max.addEventListener('blur', ev => {
        validateCrop(ev, ...cropArgs)
    })

    benches[fileIndex] = bench

    updateComparison()

    instructions.style.display = 'none'
    navigation.removeAttribute('style')
    results.removeAttribute('style')
}

function adjustExtremes(minimum, maximum, elapsed) {
    let min = parseInt(minimum.value)
    let max = parseInt(maximum.value)

    if (min < 0) {
        min = 0
        minimum.value = 0
    }
    else if (min > elapsed) {
        min = elapsed
        minimum.value = elapsed
    }

    if (max < 0) {
        max = 0
        maximum.value = 0
    }
    else if (max > elapsed) {
        max = elapsed
        maximum.value = elapsed
    }

    return [min, max]
}

function validateCrop(ev, bench, elapsed, min, max) {
    if (ev.type === 'keydown') {
        if (ev.key === 'Enter') {
            updateStats(bench, ...adjustExtremes(min, max, elapsed))
        }
    }
    else if (ev.type === 'blur') {
        updateStats(bench, ...adjustExtremes(min, max, elapsed))
    }

}

function processCSV(fileName, fileIndex, data) {
    let infoRow
    for (const [index, row] of data.entries()) {
        const lowerCaseRow = row.map(entry => entry.toLowerCase())
        if (lowerCaseRow.includes('msbetweenpresents')) {
            infoRow = lowerCaseRow
            data = data.slice(index + 1)
            processPresentMon(fileName, fileIndex, data, infoRow)
            break
        }
        else if(lowerCaseRow.includes('cpuscheduler')) {
            infoRow = data[index + 2].map(entry => entry.toLowerCase())
            data = data.slice(index + 3)
            processMangoHud(fileName, fileIndex, data, infoRow)
            break
        }
    }
}

function processMangoHud(fileName, fileIndex, data, infoRow) {
    const bench = {
        file_name: fileName,
        file_index: fileIndex
    }

    const frameTimes = []
    const elapsed = []

    const presentIndex = infoRow.indexOf('frametime')

    let frameCount = 0
    let benchmarkTime = 0
    for (const row of data) {
        const present = parseFloat(row[presentIndex]) / 1000
        if (present) {
            benchmarkTime += present
            frameTimes.push(present)
            elapsed.push(benchmarkTime)
            frameCount++
        }
    }

    bench.full_frame_times = frameTimes
    bench.full_elapsed = elapsed
    bench.full_frame_count = frameCount
    bench.full_benchmark_time = benchmarkTime

    updateStats(bench, null, null)
}

function processPresentMon(fileName, fileIndex, data, infoRow) {
    const firstRow = data[0]

    const bench = {
        file_name: fileName,
        file_index: fileIndex,
        application: firstRow[infoRow.indexOf('application')],
        runtime: firstRow[infoRow.indexOf('runtime')]
    }

    const frameTimes = []
    const elapsed = []
    const presentModes = []
    const syncIntervals = []

    const presentIndex = infoRow.indexOf('msbetweenpresents')
    const droppedIndex = infoRow.indexOf('dropped')
    const allowsTearingIndex = infoRow.indexOf('allowstearing')
    const dwmNotifiedIndex = infoRow.indexOf('dwmnotified')
    const wasBatchedIndex = infoRow.indexOf('wasbatched')
    const presentModeIndex = infoRow.indexOf('presentmode')
    const syncIntervalIndex = infoRow.indexOf('syncinterval')

    let frameCount = 0
    let benchmarkTime = 0
    let dropped = 0
    let allowsTearing = 0
    let dwmNotified = 0
    let wasBatched = 0
    for (const row of data) {
        const present = parseFloat(row[presentIndex])
        if (present) {
            benchmarkTime += present
            frameTimes.push(present)
            elapsed.push(benchmarkTime)
            frameCount++

            presentModes.push(row[presentModeIndex])
            syncIntervals.push(row[syncIntervalIndex])

            if (parseInt(row[droppedIndex]) === 1) {
                dropped++
            }
            if (parseInt(row[allowsTearingIndex]) === 1) {
                allowsTearing++
            }
            if (parseInt(row[dwmNotifiedIndex]) === 1) {
                dwmNotified++
            }
            if (parseInt(row[wasBatchedIndex]) === 1) {
                wasBatched++
            }
        }
    }

    bench.full_frame_times = frameTimes
    bench.full_elapsed = elapsed
    bench.full_frame_count = frameCount
    bench.full_benchmark_time = benchmarkTime
    bench.dropped_frames = dropped
    bench.allows_tearing = allowsTearing
    bench.dwm_notified = dwmNotified
    bench.was_batched = wasBatched

    let presentMode = presentModes[0]
    if (presentModes.some(frame => frame !== presentMode)) {
        presentMode = 'Mixed'
    }
    bench.present_mode = presentMode

    let syncInterval = syncIntervals[0]
    if (syncIntervals.some(frame => frame !== syncInterval)) {
        syncInterval = 'Mixed'
    }
    bench.sync_interval = syncInterval

    updateStats(bench, null, null)
}

const cfxPresentModes = {
    1: 'Hardware: Legacy Flip',
    2: 'Hardware: Legacy Copy to front buffer',
    3: 'Hardware: Independent Flip',
    4: 'Composed: Flip',
    5: 'Hardware Composed: Independent Flip',
    6: 'Composed: Copy with GPU GDI',
    7: 'Composed: Copy with CPU GDI',
    8: 'Composed: Composition Atlas'
}

function processJSON(fileName, fileIndex, data) {
    const run = data['Runs'][0]

    const bench = {
        file_name: fileName,
        file_index: fileIndex,
        full_frame_times: run['CaptureData']['MsBetweenPresents'],
        application: data['Info']['ProcessName'],
        present_mode: cfxPresentModes[run['CaptureData']['PresentMode']?.[0]],
        runtime: run['PresentMonRuntime'],
        allows_tearing: run['CaptureData']['AllowsTearing']?.filter(frame => frame === 1).length,
        dwm_notified: run['CaptureData']['DwmNotified']?.filter(frame => frame === 1).length,
        was_batched: run['CaptureData']['WasBatched']?.filter(frame => frame === 1).length,
        dropped_frames: run['CaptureData']['Dropped']?.filter(frame => frame === true).length
    }

    const elapsed = []

    let frameCount = 0
    let benchmarkTime = 0
    for (const present of bench.full_frame_times) {
        benchmarkTime += present
        elapsed.push(benchmarkTime)
        frameCount++
    }

    bench.full_elapsed = elapsed
    bench.full_frame_count = frameCount
    bench.full_benchmark_time = benchmarkTime

    const syncIntervals = run['CaptureData']['SyncInterval']
    let syncInterval = syncIntervals?.[0]
    if (syncIntervals?.some(frame => frame !== syncInterval)) {
        syncInterval = 'Mixed'
    }
    bench.sync_interval = syncInterval

    updateStats(bench, null, null)
}

exportButton.addEventListener('click', ev => {
    navigation.style.display = 'none'
    metric.style.display = 'none'
    crop.innerHTML = `
        .crop {
            display: none;
        }
    `
    html2canvas(document.body).then(content => {
        const link = document.createElement('a')
        const uri = content.toDataURL()
        if (typeof(link.download) === 'string') {
            link.href = uri
            link.download = 'export.png'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
        else {
            window.open(uri)
        }
        navigation.removeAttribute('style')
        metric.removeAttribute('style')
        crop.innerHTML = ''
    })
})

metric.addEventListener('click', ev => {
    updateComparison()
})