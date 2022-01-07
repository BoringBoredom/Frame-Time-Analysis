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


let fileCount = 0
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
            instructions.style.display = 'none'
            Papa.parse(file, {
                complete: (result) => {
                    processCSV(fileName, ++fileCount, result.data)
                }
            })
        }
        else if (fileName.endsWith('.json')) {
            instructions.style.display = 'none'
            processJSON(fileName, ++fileCount, JSON.parse(await file.text()))
        }
    }
})

const comparisonChart = new Chart(comparison, {
    type: 'bar',
    data: {
        labels: benches.map(bench => bench.file_name),
        datasets: [{
            label: metric.value,
            data: benches.map(bench => bench[metric.value]),
            backgroundColor: 'rgb(0,191,255)'
        }]
    },
    options: {
        indexAxis: 'y',
        scales: {
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

function completeStats(bench) {
    const frameTimes = bench.frame_times
    const benchmarkTime = bench.benchmark_time * 1000
    const frameCount = bench.frame_count

    const sortedFrameTimes = [...frameTimes].sort((a, b) => b - a)
    bench.sorted_frame_times = sortedFrameTimes

    bench['Max'] = (1000 / sortedFrameTimes.at(-1)).toFixed(2)
    bench['Avg'] = (1000 / (benchmarkTime / frameCount)).toFixed(2)
    bench['Min'] = (1000 / sortedFrameTimes[0]).toFixed(2)

    const values = [1, 0.1, 0.01]

    for (const percentile of values) {
        const fps = 1000 / sortedFrameTimes[Math.ceil(percentile / 100 * frameCount) - 1]
        bench[`${percentile} %ile`] = fps.toFixed(2)
    }

    for (const low of values) {
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

    appendBench(bench)
}

function appendBench(bench) {
    const fileCount = bench.file_count

    benchmarks.insertAdjacentHTML('beforeend', `
        <div class="bench">
            <p>
                ${bench.file_name} | ${bench.application} | ${bench.runtime} | ${bench.present_mode}
            </p>
            <div class="charts">
                <div class="column">
                    <canvas id="bar-${fileCount}">
                    </canvas>
                </div>
                <div class="column">
                    <canvas id="scatter-${fileCount}">
                    </canvas>
                </div>
            </div>
        </div>
    `)

    const bar = new Chart(document.getElementById(`bar-${fileCount}`), {
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

    const scatter = new Chart(document.getElementById(`scatter-${fileCount}`), {
        type: 'scatter',
        data: {
            labels: bench.elapsed,
            datasets: [{
                label: 'Frame Times',
                data: bench.frame_times,
                backgroundColor: 'rgb(0,191,255)',
                borderWidth: 0,
                radius: 1
            }]
        },
        options: {
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    })

    benches.push(bench)

    results.removeAttribute('style')

    updateComparison()
}

function processCSV(fileName, fileCount, data) {
    let infoRow
    for (const [index, row] of data.entries()) {
        if (row.includes('MsBetweenPresents')) {
            infoRow = row
            data = data.slice(index + 1)
            break
        }
    }

    const firstRow = data[0]

    const bench = {
        file_name: fileName,
        file_count: fileCount,
        application: firstRow[infoRow.indexOf('Application')],
        present_mode: firstRow[infoRow.indexOf('PresentMode')],
        runtime: firstRow[infoRow.indexOf('Runtime')]
    }

    const frametimes = []
    const elapsed = []

    const presentIndex = infoRow.indexOf('MsBetweenPresents')
    const elapsedIndex = infoRow.indexOf('TimeInSeconds')

    let frameCount = 0
    for (const row of data) {
        const present = parseFloat(row[presentIndex])
        const currentElapsed = parseFloat(row[elapsedIndex])
        if (present && currentElapsed) {
            frametimes.push(present)
            elapsed.push(currentElapsed)
            frameCount++
        }
    }

    bench.frame_times = frametimes
    bench.elapsed = elapsed
    bench.frame_count = frameCount
    bench.benchmark_time = elapsed.at(-1)

    completeStats(bench)
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

function processJSON(fileName, fileCount, data) {
    const run = data['Runs'][0]

    const bench = {
        file_name: fileName,
        file_count: fileCount,
        application: data['Info']['ProcessName'],
        present_mode: cfxPresentModes[run['CaptureData']['PresentMode']?.[0]],
        runtime: run['PresentMonRuntime']
    }

    bench.frame_times = run['CaptureData']['MsBetweenPresents']
    bench.elapsed = run['CaptureData']['TimeInSeconds']
    bench.frame_count = bench.frame_times.length
    bench.benchmark_time = bench.elapsed.at(-1)

    completeStats(bench)
}

exportButton.addEventListener('click', ev => {
    navigation.style.display = 'none'
    metric.style.display = 'none'
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
    })
})

metric.addEventListener('click', ev => {
    updateComparison()
})

function updateComparison() {
    comparisonChart.data.labels = benches.map(bench => bench.file_name)
    comparisonChart.data.datasets[0].label = metric.value
    comparisonChart.data.datasets[0].data = benches.map(bench => bench[metric.value])
    comparisonChart.update()
}