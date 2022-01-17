Chart.defaults.animation = false
Chart.defaults.events = []

const navigation = document.getElementById('navigation')

const instructions = document.getElementById('instructions')
const readme = document.getElementById('show-readme')

const results = document.getElementById('results')
const benchmarks = document.getElementById('benchmarks')
const comparisons = document.getElementById('comparisons')
const comparisonContainer = document.getElementById('comparison-container')
const comparison = document.getElementById('comparison')
const metric = document.getElementById('metric')
const metricLabels = document.getElementById('metric-labels')

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
        maintainAspectRatio: false,
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
    'Max': 'rgb(50,205,50)',
    'Avg': 'rgb(154,205,50)',
    'Min': 'rgb(0,255,0)',
    '1 %ile': 'rgb(0,191,255)',
    '0.1 %ile': 'rgb(0,206,209)',
    '0.01 %ile': 'rgb(127,255,212)',
    '0.001 %ile': 'rgb(0,255,255)',
    '1 % low': 'rgb(255,127,80)',
    '0.1 % low': 'rgb(255,165,0)',
    '0.01 % low': 'rgb(255,215,0)',
    '0.001 % low': 'rgb(255,255,0)'
}

function updateComparison() {
    comparisonContainer.style.height = `${6 + (fileIndex + 1) * 20}vh`
    comparisonChart.data.labels = benches.map(bench => [...metricLabels.options].filter(option => option.selected).map(option => bench[option.value] ?? ''))
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
    const metric = scatterChart.data.datasets[0].label.split(' | ')[0]
    scatterChart.data.datasets[0].label = `${metric} | ${bench.frame_count} frames`
    scatterChart.options.scales.x.min = parseInt(document.getElementById(`min-${bench.file_index}`).value)
    scatterChart.options.scales.x.max = parseInt(document.getElementById(`max-${bench.file_index}`).value)
    scatterChart.update()

    updateComparison()
}

function appendBench(bench) {
    const fileIndex = bench.file_index
    const elapsed = Math.ceil(bench.full_benchmark_time)
    const frameCount = bench.full_frame_count

    const droppedPercentage = (bench.dropped_frames / frameCount * 100).toFixed(2)
    const allowsTearingPercentage = (bench.allows_tearing / frameCount * 100).toFixed(2)
    const dwmNotifiedPercentage = (bench.dwm_notified / frameCount * 100).toFixed(2)
    const wasBatchedPercentage = (bench.was_batched / frameCount * 100).toFixed(2)

    benchmarks.insertAdjacentHTML('beforeend', `
        <div class="bench">
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>File Name & Comment</th>
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
                            <td>
                                <div style="display:flex; align-items:center;">
                                    <div class="edit-comment" id="edit-comment-${fileIndex}">✏</div>
                                    <div>
                                        ${bench.file_name}<br>
                                        <input class="file-comment" id="comment-${fileIndex}" type="text" value="${bench.comment ?? ''}">
                                    </div>
                                </div>
                            </td>
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
                    <canvas id="bar-${fileIndex}"></canvas>
                </div>
                <div class="column">
                    <select class="chart-metric" id="chart-metric-${fileIndex}" size="2">
                        <option value="FPS" selected>FPS</option>
                        <option value="ms">ms</option>
                    </select>
                    <div>
                        <canvas id="scatter-${fileIndex}"></canvas>
                    </div>
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
                label: `FPS | ${frameCount} frames`,
                data: bench.full_fps,
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

    document.getElementById(`chart-metric-${fileIndex}`).addEventListener('click', ev => {
        const metric = ev.currentTarget.value

        const scatterChart = bench.scatter_chart
        scatterChart.data.datasets[0].label = `${metric} | ${bench.frame_count} frames`
        scatterChart.data.datasets[0].data = (metric === 'FPS' ? bench.full_fps : bench.full_frame_times)
        scatterChart.update()
    })

    const fileComment = document.getElementById(`comment-${fileIndex}`)

    fileComment.addEventListener('keydown', ev => {
        modifyComment(bench, ev, fileComment.value)
    })

    fileComment.addEventListener('blur', ev => {
        modifyComment(bench, ev, fileComment.value)
    })

    document.getElementById(`edit-comment-${fileIndex}`).addEventListener('click', ev => {
        fileComment.focus()
    })

    benches[fileIndex] = bench

    updateComparison()

    instructions.style.display = 'none'
    navigation.removeAttribute('style')
    results.removeAttribute('style')
}

function modifyComment(bench, ev, comment) {
    if (ev.type === 'keydown') {
        if (ev.key === 'Enter') {
            bench.comment = comment
            updateComparison()
        }
    }
    else if (ev.type === 'blur') {
        bench.comment = comment
        updateComparison()
    }
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
    let infoRow, comment
    for (const [index, row] of data.entries()) {
        if (row[0].includes('//Comment=')) {
            comment = row.join(',').replace('//Comment=', '')
        }
        const lowerCaseRow = row.map(entry => entry.toLowerCase())
        if (lowerCaseRow.includes('msbetweenpresents')) {
            infoRow = lowerCaseRow
            data = data.slice(index + 1)
            processPresentMon(fileName, fileIndex, data, infoRow, comment)
            break
        }
        else if (lowerCaseRow.includes('cpuscheduler')) {
            infoRow = data[index + 2].map(entry => entry.toLowerCase())
            data = data.slice(index + 3)
            processMangoHud(fileName, fileIndex, data, infoRow, comment)
            break
        }
    }
}

function processMangoHud(fileName, fileIndex, data, infoRow, comment) {
    const bench = {
        file_name: fileName,
        file_index: fileIndex,
        comment: comment
    }

    const frameTimes = []
    const fps = []
    const elapsed = []

    const presentIndex = infoRow.indexOf('frametime')

    let frameCount = 0
    let benchmarkTime = 0
    for (const row of data) {
        const present = parseFloat(row[presentIndex]) / 1000
        if (!isNaN(present)) {
            benchmarkTime += present
            frameTimes.push(present)
            fps.push(1000 / present)
            elapsed.push(benchmarkTime)
            frameCount++
        }
    }

    bench.full_frame_times = frameTimes
    bench.full_fps = fps
    bench.full_elapsed = elapsed
    bench.full_frame_count = frameCount
    bench.full_benchmark_time = benchmarkTime

    updateStats(bench, null, null)
}

function processPresentMon(fileName, fileIndex, data, infoRow, comment) {
    const bench = {
        file_name: fileName,
        file_index: fileIndex,
        comment: comment
    }

    const frameTimes = []
    const fps = []
    const elapsed = []

    const applications = new Set()
    const runtimes = new Set()
    const presentModes = new Set()
    const syncIntervals = new Set()

    const applicationIndex = infoRow.indexOf('application')
    const runtimeIndex = infoRow.indexOf('runtime')
    const presentIndex = infoRow.indexOf('msbetweenpresents')
    const droppedIndex = infoRow.indexOf('dropped')
    const allowsTearingIndex = infoRow.indexOf('allowstearing')
    const dwmNotifiedIndex = infoRow.indexOf('dwmnotified')
    const wasBatchedIndex = infoRow.indexOf('wasbatched')
    const presentModeIndex = infoRow.indexOf('presentmode')
    const syncIntervalIndex = infoRow.indexOf('syncinterval')

    let dwmNotified, wasBatched
    if (dwmNotifiedIndex !== -1) {
        dwmNotified = 0
    }
    if (wasBatchedIndex !== -1) {
        wasBatched = 0
    }

    let frameCount = 0
    let benchmarkTime = 0
    let dropped = 0
    let allowsTearing = 0

    for (const row of data) {
        const present = parseFloat(row[presentIndex])
        if (!isNaN(present)) {
            benchmarkTime += present
            frameTimes.push(present)
            fps.push(1000 / present)
            elapsed.push(benchmarkTime)
            frameCount++

            applications.add(row[applicationIndex])
            runtimes.add(row[runtimeIndex])
            presentModes.add(row[presentModeIndex])
            syncIntervals.add(row[syncIntervalIndex])

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
    bench.full_fps = fps
    bench.full_elapsed = elapsed
    bench.full_frame_count = frameCount
    bench.full_benchmark_time = benchmarkTime
    bench.dropped_frames = dropped
    bench.allows_tearing = allowsTearing
    bench.dwm_notified = dwmNotified
    bench.was_batched = wasBatched

    bench.application = [...applications].join(', ')
    bench.runtime = [...runtimes].join(', ')
    bench.present_mode = [...presentModes].join(', ')
    bench.sync_interval = [...syncIntervals].join(', ')

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
        runtime: run['PresentMonRuntime'],
        comment: data['Info']['Comment'],
        allows_tearing: run['CaptureData']['AllowsTearing']?.filter(frame => frame === 1).length,
        dwm_notified: run['CaptureData']['DwmNotified']?.filter(frame => frame === 1).length,
        was_batched: run['CaptureData']['WasBatched']?.filter(frame => frame === 1).length,
        dropped_frames: run['CaptureData']['Dropped']?.filter(frame => frame === true).length
    }

    const elapsed = []
    const fps = []

    let frameCount = 0
    let benchmarkTime = 0
    for (const present of bench.full_frame_times) {
        benchmarkTime += present
        elapsed.push(benchmarkTime)
        fps.push(1000 / present)
        frameCount++
    }

    bench.full_elapsed = elapsed
    bench.full_fps = fps
    bench.full_frame_count = frameCount
    bench.full_benchmark_time = benchmarkTime

    let presentMode = [...new Set(run['CaptureData']['PresentMode'])].map(pMode => cfxPresentModes[pMode]).join(', ')
    if (presentMode === '') {
        presentMode = '?'
    }
    bench.present_mode = presentMode

    let syncInterval = [...new Set(run['CaptureData']['SyncInterval'])].join(', ')
    if (syncInterval === '') {
        syncInterval = '?'
    }
    bench.sync_interval = syncInterval

    updateStats(bench, null, null)
}

document.getElementById('export').addEventListener('click', ev => {
    crop.innerHTML = `
        #navigation, #metric, .crop, .chart-metric, #metric-labels {
            display: none;
        }
    `
    window.scrollTo(0, 0)

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
        crop.innerHTML = ''
    })
})

document.getElementById('benches').addEventListener('click', ev => {
    benchmarks.scrollIntoView()
})

document.getElementById('summary').addEventListener('click', ev => {
    comparisons.scrollIntoView()
})

metric.addEventListener('click', ev => {
    updateComparison()
})

metricLabels.addEventListener('click', ev => {
    updateComparison()
})

readme.addEventListener('click', ev => {
    document.getElementById('readme').removeAttribute('style')
})