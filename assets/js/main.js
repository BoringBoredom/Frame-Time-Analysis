const results = document.getElementById('results')
const instructions = document.getElementById('instructions')

let fileCount = 0

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
    instructions.style.display = 'none'
    for (const file of ev.dataTransfer.files) {
        Papa.parse(file, {
            complete: (result) => appendBench(file.name, result.data, ++fileCount)
        })
    }
})

function appendBench(name, data, fileCount) {
    const bench = { lows: {}, percentiles: {} }
    const frametimes = []
    const horGraphAxis = []
    const values = [1, 0.1, 0.01]
    const index = data[0].indexOf('MsBetweenPresents')
    const presentMode = data[1][data[0].indexOf('PresentMode')]
    const application = data[1][data[0].indexOf('Application')]

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

    const sortedFrameTimes = [...frametimes].sort().reverse()

    bench.max = (1000 / sortedFrameTimes.at(-1)).toFixed(2)
    bench.avg = (1000 / (benchmarkTime / frameCount)).toFixed(2)
    bench.min = (1000 / sortedFrameTimes[0]).toFixed(2)

    for (const percentile of values) {
        const fps = 1000 / sortedFrameTimes[Math.ceil(percentile / 100 * frameCount) - 1]
        bench.percentiles[percentile] = fps.toFixed(2)
    }

    for (const low of values) {
        let currentTotal = 0
        for (const present of sortedFrameTimes) {
            currentTotal += present
            if (currentTotal >= low / 100 * benchmarkTime) {
                const fps = 1000 / present
                bench.lows[low] = fps.toFixed(2)
                break
            }
        }
    }

    results.insertAdjacentHTML('beforeend', `
        <div class="row">
            <p class="title">
                ${name} | ${application} | ${presentMode}
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
                data: [bench.max, bench.avg, bench.min, bench.percentiles['1'], bench.percentiles['0.1'], bench.percentiles['0.01'], bench.lows['1'], bench.lows['0.1'], bench.lows['0.01']],
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
                backgroundColor: 'rgb(0,191,255)'
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
}

document.getElementById('export').addEventListener('click', ev => {
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
    })
})