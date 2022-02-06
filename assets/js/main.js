Chart.defaults.animation = false
Chart.defaults.events = ['click']

const values = [
    5,
    4,
    3,
    2,
    1,
    0.9,
    0.8,
    0.7,
    0.6,
    0.5,
    0.4,
    0.3,
    0.2,
    0.1,
    0.09,
    0.08,
    0.07,
    0.06,
    0.05,
    0.04,
    0.03,
    0.02,
    0.01,
    0.009,
    0.008,
    0.007,
    0.006,
    0.005
]

const colors = {
    'Max': 'rgb(50,205,50)',
    'Avg': 'rgb(154,205,50)',
    'Min': 'rgb(0,255,0)',
    '1 %ile': 'rgb(0,191,255)',
    '0.1 %ile': 'rgb(0,206,209)',
    '0.01 %ile': 'rgb(127,255,212)',
    '0.005 %ile': 'rgb(0,255,255)',
    '1 % low': 'rgb(255,127,80)',
    '0.1 % low': 'rgb(255,165,0)',
    '0.01 % low': 'rgb(255,215,0)',
    '0.005 % low': 'rgb(255,255,0)'
}

const colorList = [
    'rgb(255,0,0)',
    'rgb(0,255,0)',
    'rgb(0,0,255)',
    'rgb(255,255,0)',
    'rgb(0,255,255)',
    'rgb(255,0,255)',
    'rgb(192,192,192)',
    'rgb(128,128,128)',
    'rgb(128,0,0)',
    'rgb(128,128,0)',
    'rgb(0,128,0)',
    'rgb(128,0,128)',
    'rgb(0,128,128)',
    'rgb(0,0,128)',
]

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

const mainMetrics = [
    'Max',
    'Avg',
    'Min',
    '1 %ile',
    '0.1 %ile',
    '0.01 %ile',
    '0.005 %ile',
    '1 % low',
    '0.1 % low',
    '0.01 % low',
    '0.005 % low'
]

const navigation = document.getElementById('navigation')
const instructions = document.getElementById('instructions')
const aggregate = document.getElementById('aggregate')
const results = document.getElementById('results')
const benchmarks = document.getElementById('benchmarks')
const comparisons = document.getElementById('comparisons')
const comparisonContainer = document.getElementById('comparison-container')
const metric = document.getElementById('metric')
const fileDescriptions = document.getElementById('file-descriptions')
const chartMetricComparison = document.getElementById('chart-metric-comparison')
const presentModeTooltip = document.getElementById('present-mode-tooltip')
const wasBatchedTooltip = document.getElementById('was-batched-tooltip')

const hideForExport = document.createElement('style')
document.head.append(hideForExport)

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
        if (fileIndex >= 13) {
            break
        }
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

const frameTimeOverlayChart = new Chart(document.getElementById('frame-time-overlay'), {
    type: 'scatter',
    data: {
        datasets: []
    },
    options: {
        parsing: false,
        normalized: true,
        showLine: true,
        scales: {
            x: {
                min: 0,
                grid: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Elapsed (ms)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'FPS'
                }
            }
        },
        radius: 0,
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    onPanComplete({chart}) {
                        const minimum = chart.options.scales.x.min
                        const maximum = chart.options.scales.x.max
                        for (const bench of benches) {
                            updateStats(bench, minimum, maximum, true)
                        }
                        updateOverlays(true)
                        updateComparison()
                    }
                },
                zoom: {
                    wheel: {
                        enabled: true,
                        modifierKey: 'ctrl'
                    },
                    mode: 'x',
                    onZoomComplete({chart}) {
                        const minimum = chart.options.scales.x.min
                        const maximum = chart.options.scales.x.max
                        for (const bench of benches) {
                            updateStats(bench, minimum, maximum, true)
                        }
                        updateOverlays(true)
                        updateComparison()
                    }
                },
                limits: {
                    x: {
                        min: 0,
                        max: 'original'
                    }
                }
            }
        }
    }
})

chartMetricComparison.addEventListener('click', ev => {
    const metric = chartMetricComparison.value

    frameTimeOverlayChart.data.datasets = benches.map(bench => {
        return {
            label: [...fileDescriptions.options].filter(option => option.selected).map(option => bench[option.value] ?? '').join(' | '),
            data: (metric === 'FPS') ? bench.chart_format.full_fps : bench.chart_format.full_frame_times,
            backgroundColor: colorList[bench.file_index],
            borderColor: colorList[bench.file_index]
        }
    })
    frameTimeOverlayChart.options.scales.y.title.text = metric
    frameTimeOverlayChart.update()
})

const percentileOverlayChart = new Chart(document.getElementById('percentile-overlay'), {
    type: 'line',
    data: {
        labels: values,
        datasets: []
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Percentile'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'FPS'
                }
            }
        }
    }
})

const lowsOverlayChart = new Chart(document.getElementById('lows-overlay'), {
    type: 'line',
    data: {
        labels: values,
        datasets: []
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: '% low'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'FPS'
                }
            }
        }
    }
})

const comparisonChart = new Chart(document.getElementById('comparison'), {
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
                min: 0,
                title: {
                    display: true,
                    text: 'FPS'
                }
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

function updateComparison() {
    comparisonContainer.style.height = `${6 + (fileIndex + 1) * 20}vh`
    comparisonChart.data.labels = benches.map(bench => [...fileDescriptions.options].filter(option => option.selected).map(option => bench[option.value] ?? ''))
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

function updateStats(bench, min= null, max= null, comparison= false) {
    let isOld
    if (min !== null || max !== null) {
        isOld = true
    }

    let frameTimes, benchmarkTime, frameCount

    if (isOld) {
        frameTimes = []
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
        }

        frameCount = frameTimes.length

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

    if (!comparison) {
        if (isOld) {
            updateBench(bench)
        }
        else {
            appendBench(bench)
        }
    }
}

function updateBench(bench) {
    const barChart = bench.bar_chart
    barChart.data.datasets[0].data = mainMetrics.map(metric => bench[metric])
    barChart.update()

    const scatterChart = bench.scatter_chart
    scatterChart.options.scales.x.min = parseFloat(bench.crop_fields.min.value)
    scatterChart.options.scales.x.max = parseFloat(bench.crop_fields.max.value)
    scatterChart.update()

    const highest = Math.ceil(Math.max(bench[`${values[0]} %ile`], bench[`${values[0]} % low`]))
    const lowest = Math.floor(Math.min(bench[`${values[values.length - 1]} %ile`], bench[`${values[values.length - 1]} % low`]))

    const percChart = bench.l_percentiles
    percChart.data.datasets[0].data = values.map(value => bench[`${value} %ile`])
    percChart.options.scales.y.min = lowest
    percChart.options.scales.y.max = highest
    percChart.update()

    const lowChart = bench.l_lows
    lowChart.data.datasets[0].data = values.map(value => bench[`${value} % low`])
    lowChart.options.scales.y.min = lowest
    lowChart.options.scales.y.max = highest
    lowChart.update()
}

function updateOverlays(old= false) {
    const labelTypes = [...fileDescriptions.options].filter(option => option.selected)
    const metric = chartMetricComparison.value

    let highest = 0
    frameTimeOverlayChart.data.datasets = benches.map(bench => {
        highest = Math.max(highest, bench.full_benchmark_time)

        return {
            label: labelTypes.map(option => bench[option.value] ?? '').join(' | '),
            data: (metric === 'FPS') ? bench.chart_format.full_fps : bench.chart_format.full_frame_times,
            backgroundColor: colorList[bench.file_index],
            borderColor: colorList[bench.file_index]
        }
    })
    if (!old) {
        frameTimeOverlayChart.options.scales.x.max = Math.ceil(highest)
    }

    frameTimeOverlayChart.update()

    percentileOverlayChart.data.datasets = benches.map(bench => {
        return {
            label: labelTypes.map(option => bench[option.value] ?? '').join(' | '),
            data: values.map(value => bench[`${value} %ile`]),
            backgroundColor: colorList[bench.file_index],
            borderColor: colorList[bench.file_index]
        }
    })
    percentileOverlayChart.update()

    lowsOverlayChart.data.datasets = benches.map(bench => {
        return {
            label: labelTypes.map(option => bench[option.value] ?? '').join(' | '),
            data: values.map(value => bench[`${value} % low`]),
            backgroundColor: colorList[bench.file_index],
            borderColor: colorList[bench.file_index]
        }
    })
    lowsOverlayChart.update()
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
                            <th id="present-mode-hover-${fileIndex}">Present Mode</th>
                            <th>Duration (ms)</th>
                            <th>Sync Interval</th>
                            <th>Dropped Frames</th>
                            <th>Allows Tearing</th>
                            <th>DWM Notified</th>
                            <th id="was-batched-hover-${fileIndex}">Was Batched</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div style="display:flex; align-items:center;">
                                    <div class="edit-comment" id="edit-comment-${fileIndex}">
                                        <img src="assets/img/pencil.png">
                                    </div>
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
            <div class="charts">
                <div class="column">
                    <canvas id="l-perc-${fileIndex}"></canvas>
                </div>
                <div class="column">
                    <canvas id="l-low-${fileIndex}"></canvas>
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

    const presentModeHover = document.getElementById(`present-mode-hover-${fileIndex}`)
    presentModeHover.addEventListener('mouseover', ev => {
        presentModeTooltip.style.display = 'block'
        presentModeTooltip.style.top = `${ev.y}px`
    })
    presentModeHover.addEventListener('mouseleave', ev => {
        presentModeTooltip.style.display = 'none'
    })

    const wasBatchedHover = document.getElementById(`was-batched-hover-${fileIndex}`)
    wasBatchedHover.addEventListener('mouseover', ev => {
        wasBatchedTooltip.style.display = 'block'
        wasBatchedTooltip.style.top = `${ev.y}px`
    })
    wasBatchedHover.addEventListener('mouseleave', ev => {
        wasBatchedTooltip.style.display = 'none'
    })

    const min = document.getElementById(`min-${fileIndex}`)
    const max = document.getElementById(`max-${fileIndex}`)
    bench.crop_fields = {
        min: min,
        max: max
    }

    bench.bar_chart = new Chart(document.getElementById(`bar-${fileIndex}`), {
        type: 'bar',
        data: {
            labels: mainMetrics,
            datasets: [{
                data: mainMetrics.map(metric => bench[metric])
            }]
        },
        options: {
            backgroundColor: 'rgb(0,191,255)',
            borderWidth: 0,
            indexAxis: 'y',
            scales: {
                x: {
                    min: 0,
                    title: {
                        display: true,
                        text: 'FPS'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
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
            datasets: [{
                data: bench.chart_format.full_fps
            }]
        },
        options: {
            parsing: false,
            normalized: true,
            backgroundColor: 'rgb(0,191,255)',
            borderWidth: 0,
            radius: 2,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    min: 0,
                    max: elapsed,
                    title: {
                        display: true,
                        text: 'Elapsed (ms)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'FPS'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        onPanComplete({chart}) {
                            const minimum = chart.options.scales.x.min
                            const maximum = chart.options.scales.x.max
                            min.value = minimum
                            max.value = maximum
                            updateStats(bench, minimum, maximum)
                        }
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: 'ctrl'
                        },
                        mode: 'x',
                        onZoomComplete({chart}) {
                            const minimum = chart.options.scales.x.min
                            const maximum = chart.options.scales.x.max
                            min.value = minimum
                            max.value = maximum
                            updateStats(bench, minimum, maximum)
                        }
                    },
                    limits: {
                        x: {
                            min: 0,
                            max: elapsed
                        }
                    }
                }
            }
        }
    })

    const highest = Math.ceil(Math.max(bench[`${values[0]} %ile`], bench[`${values[0]} % low`]))
    const lowest = Math.floor(Math.min(bench[`${values[values.length - 1]} %ile`], bench[`${values[values.length - 1]} % low`]))

    bench.l_percentiles = new Chart(document.getElementById(`l-perc-${fileIndex}`), {
        type: 'line',
        data: {
            labels: values,
            datasets: [{
                data: values.map(value => bench[`${value} %ile`])
            }]
        },
        options: {
            backgroundColor: 'rgb(0,191,255)',
            borderColor: 'rgb(0,191,255)',
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Percentile'
                    }
                },
                y: {
                    min: lowest,
                    max: highest,
                    title: {
                        display: true,
                        text: 'FPS'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    })

    bench.l_lows = new Chart(document.getElementById(`l-low-${fileIndex}`), {
        type: 'line',
        data: {
            labels: values,
            datasets: [{
                data: values.map(value => bench[`${value} % low`])
            }]
        },
        options: {
            backgroundColor: 'rgb(0,191,255)',
            borderColor: 'rgb(0,191,255)',
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '% low'
                    }
                },
                y: {
                    min: lowest,
                    max: highest,
                    title: {
                        display: true,
                        text: 'FPS'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    })

    min.addEventListener('keydown', ev => {
        validateCrop(ev, bench, elapsed, min, max)
    })

    min.addEventListener('blur', ev => {
        validateCrop(ev, bench, elapsed, min, max)
    })

    max.addEventListener('keydown', ev => {
        validateCrop(ev, bench, elapsed, min, max)
    })

    max.addEventListener('blur', ev => {
        validateCrop(ev, bench, elapsed, min, max)
    })

    document.getElementById(`chart-metric-${fileIndex}`).addEventListener('click', ev => {
        const metric = ev.currentTarget.value

        const scatterChart = bench.scatter_chart
        scatterChart.options.scales.y.title.text = metric
        scatterChart.data.datasets[0].data = (metric === 'FPS' ? bench.chart_format.full_fps : bench.chart_format.full_frame_times)
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

    updateOverlays()

    instructions.style.display = 'none'
    navigation.removeAttribute('style')
    results.removeAttribute('style')
}

function updateComments() {
    comparisonChart.data.labels = benches.map(bench => [...fileDescriptions.options].filter(option => option.selected).map(option => bench[option.value] ?? ''))
    comparisonChart.update()

    const labelTypes = [...fileDescriptions.options].filter(option => option.selected)

    const length = benches.length

    for (let index = 0; index < length; index++) {
        const bench = benches[index]

        frameTimeOverlayChart.data.datasets[index].label = labelTypes.map(option => bench[option.value] ?? '').join(' | ')
        percentileOverlayChart.data.datasets[index].label = labelTypes.map(option => bench[option.value] ?? '').join(' | ')
        lowsOverlayChart.data.datasets[index].label = labelTypes.map(option => bench[option.value] ?? '').join(' | ')
    }

    frameTimeOverlayChart.update()
    percentileOverlayChart.update()
    lowsOverlayChart.update()
}

function modifyComment(bench, ev, comment) {
    if (ev.type === 'keydown') {
        if (ev.key === 'Enter') {
            bench.comment = comment
            updateComments()
        }
    }
    else if (ev.type === 'blur') {
        bench.comment = comment
        updateComments()
    }
}

function adjustExtremes(minimum, maximum, elapsed) {
    let min = parseFloat(minimum.value)
    let max = parseFloat(maximum.value)

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
    const fullFrameTimes = []
    const fullFPS = []

    const presentIndex = infoRow.indexOf('frametime')

    let benchmarkTime = 0

    for (const row of data) {
        const present = parseFloat(row[presentIndex]) / 1000
        if (!isNaN(present)) {
            benchmarkTime += present
            frameTimes.push(present)

            fullFPS.push({ x: benchmarkTime, y: 1000 / present })
            fullFrameTimes.push({ x: benchmarkTime, y: present })
        }
    }

    bench.full_frame_times = frameTimes
    bench.full_frame_count = frameTimes.length
    bench.full_benchmark_time = benchmarkTime
    bench.chart_format = { full_fps: fullFPS, full_frame_times: fullFrameTimes }

    updateStats(bench)
}

function processPresentMon(fileName, fileIndex, data, infoRow, comment) {
    const bench = {
        file_name: fileName,
        file_index: fileIndex,
        comment: comment
    }

    const frameTimes = []
    const fullFrameTimes = []
    const fullFPS = []

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

    let allowsTearing, dwmNotified, wasBatched
    if (allowsTearingIndex !== -1) {
        allowsTearing = 0
    }
    if (dwmNotifiedIndex !== -1) {
        dwmNotified = 0
    }
    if (wasBatchedIndex !== -1) {
        wasBatched = 0
    }

    let benchmarkTime = 0
    let dropped = 0

    for (const row of data) {
        const present = parseFloat(row[presentIndex])
        if (!isNaN(present)) {
            benchmarkTime += present
            frameTimes.push(present)

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

            fullFPS.push({ x: benchmarkTime, y: 1000 / present })
            fullFrameTimes.push({ x: benchmarkTime, y: present })
        }
    }

    bench.full_frame_times = frameTimes
    bench.full_frame_count = frameTimes.length
    bench.full_benchmark_time = benchmarkTime
    bench.dropped_frames = dropped
    bench.allows_tearing = allowsTearing
    bench.dwm_notified = dwmNotified
    bench.was_batched = wasBatched
    bench.chart_format = { full_fps: fullFPS, full_frame_times: fullFrameTimes }

    bench.application = [...applications].join(', ')
    bench.runtime = [...runtimes].join(', ')
    bench.present_mode = [...presentModes].join(', ') || '?'
    bench.sync_interval = [...syncIntervals].join(', ')

    updateStats(bench)
}

function processJSON(fileName, fileIndex, data) {
    const bench = {
        file_name: fileName,
        file_index: fileIndex,
        application: data['Info']['ProcessName'],
        comment: data['Info']['Comment']
    }

    let frameTimes = []
    const fullFrameTimes = []
    const fullFPS = []

    let allowsTearing = []
    let dwmNotified = []
    let wasBatched = []
    let droppedFrames = []

    let presentModes = []
    let syncIntervals = []

    const runtimes = new Set()

    for (const run of data['Runs']) {
        frameTimes = frameTimes.concat(run['CaptureData']['MsBetweenPresents'])

        if (run['CaptureData']['AllowsTearing'] !== undefined) {
            allowsTearing = allowsTearing.concat(run['CaptureData']['AllowsTearing'])
        }

        if (run['CaptureData']['DwmNotified'] !== undefined) {
            dwmNotified = dwmNotified.concat(run['CaptureData']['DwmNotified'])
        }

        if (run['CaptureData']['WasBatched'] !== undefined) {
            wasBatched = wasBatched.concat(run['CaptureData']['WasBatched'])
        }

        if (run['CaptureData']['Dropped'] !== undefined) {
            droppedFrames = droppedFrames.concat(run['CaptureData']['Dropped'])
        }

        if (run['CaptureData']['PresentMode'] !== undefined) {
            presentModes = presentModes.concat(run['CaptureData']['PresentMode'])
        }

        if (run['CaptureData']['SyncInterval'] !== undefined) {
            syncIntervals = syncIntervals.concat(run['CaptureData']['SyncInterval'])
        }

        runtimes.add(run['PresentMonRuntime'])
    }

    let benchmarkTime = 0
    for (const present of frameTimes) {
        benchmarkTime += present
        fullFPS.push({ x: benchmarkTime, y: 1000 / present })
        fullFrameTimes.push({ x: benchmarkTime, y: present })
    }

    bench.full_frame_count = frameTimes.length
    bench.full_benchmark_time = benchmarkTime
    bench.full_frame_times = frameTimes
    bench.chart_format = { full_fps: fullFPS, full_frame_times: fullFrameTimes }

    if (allowsTearing.length !== 0) {
        bench.allows_tearing = allowsTearing.filter(frame => frame === 1).length
    }

    if (dwmNotified.length !== 0) {
        bench.dwm_notified = dwmNotified.filter(frame => frame === 1).length
    }

    if (wasBatched.length !== 0) {
        bench.was_batched = wasBatched.filter(frame => frame === 1).length
    }

    if (droppedFrames.length !== 0) {
        bench.dropped_frames = droppedFrames.filter(frame => frame === true).length
    }

    bench.runtime = [...runtimes].join(', ') || '?'
    bench.present_mode = [...new Set(presentModes)].map(pMode => cfxPresentModes[pMode]).join(', ') || '?'

    let syncInterval = [...new Set(syncIntervals)].join(', ')
    if (syncInterval === '') {
        syncInterval = '?'
    }
    bench.sync_interval = syncInterval

    updateStats(bench)
}

document.getElementById('export').addEventListener('click', async ev => {
    hideForExport.innerHTML = `
        #navigation, #metric, .crop, .chart-metric, #file-descriptions, .edit-comment {
            display: none;
        }
    `

    window.scrollTo(0, 0)
    await new Promise((resolve, reject) => {
        const posCheck = setInterval(() => {
            if (window.scrollY === 0) {
                clearInterval(posCheck)
                return resolve()
            }
        }, 100)
    })

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
        hideForExport.innerHTML = ''
    })
})

document.getElementById('jump-to-benchmarks').addEventListener('click', ev => {
    benchmarks.scrollIntoView()
})

document.getElementById('jump-to-comparisons').addEventListener('click', ev => {
    comparisons.scrollIntoView()
})

metric.addEventListener('click', ev => {
    updateComparison()
})

fileDescriptions.addEventListener('click', ev => {
    updateComments()
})

document.getElementById('show-readme').addEventListener('click', ev => {
    document.getElementById('readme').removeAttribute('style')
})

document.getElementById('show-aggregate').addEventListener('click', ev => {
    aggregate.removeAttribute('style')
})

aggregate.addEventListener('drop', async ev => {
    ev.stopImmediatePropagation()
    ev.preventDefault()

    let first = true
    let content = ''
    let indicator
    for (const file of ev.dataTransfer.files) {
        if (file.name.endsWith('.csv')) {
            const text = await file.text()
            if (first) {
                for (const line of text.split('\n')) {
                    const lowerCaseLine = line.toLowerCase()
                    if (lowerCaseLine.includes('cpuscheduler')) {
                        indicator = 'frametime'
                        break
                    }
                    if (lowerCaseLine.includes('msbetweenpresents')) {
                        indicator = 'msbetweenpresents'
                        break
                    }
                }
                content += text
                first = false
            }
            else {
                const textArray = text.split('\n')
                for (const [index, line] of textArray.entries()) {
                    const lowerCaseLine = line.toLowerCase()
                    if (lowerCaseLine.includes(indicator)) {
                        content += textArray.slice(index + 1).join('\n')
                        break
                    }
                }
            }
        }
    }

    if (content) {
        const file = new Blob([content], { type: 'text/html' })
        const link = document.createElement('a')
        const uri = URL.createObjectURL(file)
        if (typeof(link.download) === 'string') {
            link.href = uri
            link.download = 'aggregated.csv'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
        else {
            window.open(uri)
        }
    }
})