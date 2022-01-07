const results = document.getElementById('results')
const instructions = document.getElementById('instructions')
const comparisons = document.getElementById('comparisons')
const comparisonContainer = document.getElementById('comparison-container')
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
document.addEventListener('drop', ev => {
    ev.stopPropagation()
    ev.preventDefault()
    for (const file of ev.dataTransfer.files) {
        if (!file.name.endsWith('.csv')) {
            continue
        }
        instructions.style.display = 'none'
        Papa.parse(file, {
            complete: (result) => appendBench(file.name, result.data, ++fileCount)
        })
    }
})

const comparisonBar = new Chart(comparisons, {
    type: 'bar',
    data: {
        labels: benches.map(bench => bench.fileName),
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

function appendBench(fileName, data, fileCount) {
    for (const [index, row] of data.entries()) {
        if (row.includes('MsBetweenPresents')) {
            data = data.slice(index)
            break
        }
    }

    const infoRow = data[0]
    const firstRow = data[1]

    const bench = {
        fileName: fileName,
        application: firstRow[infoRow.indexOf('Application')],
        present_mode: firstRow[infoRow.indexOf('PresentMode')]
    }

    const frametimes = []
    const horGraphAxis = []
    const values = [1, 0.1, 0.01]
    const index = infoRow.indexOf('MsBetweenPresents')

    let frameCount = 0
    let benchmarkTime = 0
    for (const row of data) {
        const present = parseFloat(row[index])
        if (present) {
            frametimes.push(present)
            frameCount++
            benchmarkTime += present
            horGraphAxis.push(benchmarkTime)
        }
    }

    const sortedFrameTimes = [...frametimes].sort((a, b) => b - a)
    bench['Max'] = (1000 / sortedFrameTimes.at(-1)).toFixed(2)
    bench['Avg'] = (1000 / (benchmarkTime / frameCount)).toFixed(2)
    bench['Min'] = (1000 / sortedFrameTimes[0]).toFixed(2)

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

    results.insertAdjacentHTML('beforeend', `
        <div class="row">
            <p class="title">
                ${fileName} | ${bench.application} | ${bench.present_mode}
            </p>
            <div class="col">
                <canvas id="bar-${fileCount}">
                </canvas>
            </div>
            <div class="col">
                <canvas id="graph-${fileCount}">
                </canvas>
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

    const graph = new Chart(document.getElementById(`graph-${fileCount}`), {
        type: 'scatter',
        data: {
            labels: horGraphAxis,
            datasets: [{
                label: 'Frame Times',
                data: frametimes,
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

    comparisonContainer.removeAttribute('style')

    updateComparison()
}

const exportButton = document.getElementById('export')
exportButton.addEventListener('click', ev => {
    exportButton.style.display = 'none'
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
        exportButton.removeAttribute('style')
        metric.removeAttribute('style')
    })
})

metric.addEventListener('click', ev => {
    updateComparison()
})

function updateComparison() {
    comparisonBar.data.labels = benches.map(bench => bench.fileName)
    comparisonBar.data.datasets[0].label = metric.value
    comparisonBar.data.datasets[0].data = benches.map(bench => bench[metric.value])
    comparisonBar.update()
}