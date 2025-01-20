(() => {
    const forms = document.querySelectorAll('.needs-validation')
  
    forms.forEach((form) => {
      form.addEventListener('submit',(event) => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
        form.classList.add('was-validated')
      })
    })
  })()


let taxswitch=document.querySelector("#switch")
let moneyall=document.querySelectorAll(".money")



taxswitch.addEventListener("click",()=>{
  moneyall.forEach((money)=>{
  let price = parseFloat(money.textContent.replace(/,/g, ""))
  if (taxswitch.checked) {
    price=price*1.18
    money.textContent=price.toLocaleString()
  } else {
    let x=Math.floor(price/1.18)
  money.textContent=x.toLocaleString()
  }
}) 
})


